# Conditional imports - only load if needed
import logging
import os

logger = logging.getLogger(__name__)

class InferenceEngine:
    def __init__(self, model_id: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"):
        self.model_id = model_id
        self.model = None
        self.tokenizer = None
        self.use_gemini_fallback = False
        self.gemini_client = None
        
        # Check if we should skip local model entirely (Cloud Run)
        if os.getenv("USE_GEMINI_ONLY", "false").lower() == "true":
            logger.info("USE_GEMINI_ONLY=true detected, initializing Gemini API directly")
            self._init_gemini()
        
    def load_model(self):
        """
        Try to load local model. If it fails (OOM, no GPU, etc.), 
        fall back to Gemini API.
        """
        if self.use_gemini_fallback:
            return  # Already using Gemini
            
        if not self.model:
            try:
                logger.info(f"Attempting to load local model: {self.model_id}")
                
                # Import heavy dependencies only when needed
                from transformers import AutoModelForCausalLM, AutoTokenizer
                import torch
                
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_id, 
                    device_map="auto", 
                    torch_dtype=torch.float16
                )
                logger.info("Local model loaded successfully")
            except Exception as e:
                logger.warning(f"Local model loading failed: {e}")
                logger.info("Falling back to Google Gemini API")
                self._init_gemini()
                
    def _init_gemini(self):
        """Initialize Gemini API client"""
        try:
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment")
            genai.configure(api_key=api_key)
            self.gemini_client = genai.GenerativeModel('gemini-2.0-flash-exp')
            self.use_gemini_fallback = True
            logger.info("Gemini API initialized successfully (gemini-2.0-flash-exp)")
        except Exception as e:
            logger.error(f"Gemini initialization failed: {e}")
            raise RuntimeError("Both local model and Gemini API failed to initialize")
            
    def generate(self, prompt: str, max_tokens: int = 512):
        self.load_model()
        
        if self.use_gemini_fallback:
            try:
                response = self.gemini_client.generate_content(
                    prompt,
                    generation_config={"max_output_tokens": max_tokens, "temperature": 0.7}
                )
                return response.text
            except Exception as e:
                logger.error(f"Gemini generation failed: {e}")
                return f"Error: {str(e)}"
        else:
            # Local model inference
            input_tokens = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
                
            generation_output = self.model.generate(
                **input_tokens,
                max_new_tokens=max_tokens,
                do_sample=True,
                temperature=0.7,
                use_cache=True,
                return_dict_in_generate=True
            )
                
            output = self.tokenizer.decode(generation_output.sequences[0], skip_special_tokens=True)
            if output.startswith(prompt):
                 output = output[len(prompt):]
            return output

    def generate_stream(self, prompt: str, max_tokens: int = 512):
        """
        Yields tokens one by one for streaming response.
        """
        self.load_model()
        
        if self.use_gemini_fallback:
            # Gemini streaming
            try:
                response = self.gemini_client.generate_content(
                    prompt,
                    generation_config={"max_output_tokens": max_tokens, "temperature": 0.7},
                    stream=True
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as e:
                logger.error(f"Gemini stream error: {e}")
                yield f"Error: {str(e)}"
        else:
            # Local model streaming - import only when needed
            from transformers import TextIteratorStreamer
            from threading import Thread
            
            inputs = self.tokenizer([prompt], return_tensors="pt").to(self.model.device)
            streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
            
            generation_kwargs = dict(
                inputs, 
                streamer=streamer, 
                max_new_tokens=max_tokens,
                do_sample=True,
                temperature=0.7
            )
            
            thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
            thread.start()
            
            for new_text in streamer:
                yield new_text

inference_engine = InferenceEngine()
