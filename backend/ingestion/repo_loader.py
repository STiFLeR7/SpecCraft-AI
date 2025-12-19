import os
import shutil
import git
from typing import Optional
from backend.core.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)

class RepoLoader:
    def __init__(self, storage_path: str = None):
        # Use environment variable or default to /tmp for serverless
        self.storage_path = storage_path or os.environ.get('REPO_STORAGE_PATH', '/tmp/repos')
        os.makedirs(self.storage_path, exist_ok=True)

    def clone_repo(self, repo_url: str, repo_id: Optional[str] = None) -> str:
        """
        Clones a git repository to local storage.
        Returns the local path of the cloned repo.
        """
        if not repo_id:
            repo_id = str(uuid.uuid4())
        
        target_dir = os.path.join(self.storage_path, repo_id)
        
        if os.path.exists(target_dir):
            logger.info(f"Repo dir {target_dir} exists, removing...")
            shutil.rmtree(target_dir, ignore_errors=True) # Clean start for now

        logger.info(f"Cloning {repo_url} to {target_dir}...")
        try:
             git.Repo.clone_from(repo_url, target_dir, depth=1)
        except Exception as e:
            logger.error(f"Failed to clone repo: {e}")
            raise e
            
        return target_dir

    def get_file_list(self, repo_path: str):
        """
        Walks the repo and returns list of files avoiding .git and other ignores.
        """
        files_list = []
        for root, dirs, files in os.walk(repo_path):
            if ".git" in dirs:
                dirs.remove(".git")
            
            for file in files:
                # Add basic filtering here
                if file.startswith("."):
                    continue
                files_list.append(os.path.join(root, file))
        return files_list

repo_loader = RepoLoader()
