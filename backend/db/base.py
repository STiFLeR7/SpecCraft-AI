from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here for Alembic/metadata collection
# This relies on the models being importable (dependency loop resolution)
# We might need to handle circular imports carefully or just import them effectively
# For now, we will assume they are imported where needed, or we explicitly import them here ONLY for metadata if needed.

# But to ensure Base.metadata includes them, we must import them.
# We will do this inside a function or at the bottom to avoid circular import issues if those models import Base.

