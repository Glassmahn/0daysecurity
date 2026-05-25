-- Enable the moddatetime extension for automatic updated_at column management.
-- Required by notification_preferences and integrations triggers.
CREATE EXTENSION IF NOT EXISTS moddatetime;
