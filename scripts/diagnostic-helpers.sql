-- ============================================
-- DIAGNOSTIC HELPER FUNCTIONS - MIKY.AI
-- ============================================

-- Function to get table columns
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::TEXT,
        c.data_type::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = $1
    AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get RLS policies
CREATE OR REPLACE FUNCTION get_policies(table_name TEXT)
RETURNS TABLE(policyname NAME, cmd TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pol.policyname,
        pol.cmd
    FROM pg_policies pol
    WHERE pol.tablename = $1
    AND pol.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get triggers
CREATE OR REPLACE FUNCTION get_triggers(table_name TEXT)
RETURNS TABLE(trigger_name NAME, event_manipulation TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.trigger_name,
        t.event_manipulation
    FROM information_schema.triggers t
    WHERE t.event_object_table = $1
    AND t.trigger_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_triggers(TEXT) TO service_role;
