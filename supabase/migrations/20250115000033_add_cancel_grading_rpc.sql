-- Add RPC function for cancel grading
CREATE OR REPLACE FUNCTION cancel_grading(
  submission_id UUID,
  teacher_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Update the submission
  UPDATE submissions
  SET 
    grade = NULL,
    feedback = NULL,
    status = 'submitted',
    graded_at = NULL,
    graded_by = NULL,
    updated_at = NOW()
  WHERE id = submission_id;

  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or no rows updated';
  END IF;

  -- Get the updated submission data
  SELECT to_json(s.*) INTO result
  FROM submissions s
  WHERE s.id = submission_id;

  -- Log the cancellation activity
  INSERT INTO activity_logs (teacher_id, action, entity_type, entity_id, description)
  VALUES (teacher_id, 'cancel_grading', 'submission', submission_id, 'Teacher cancelled grading for submission');

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cancel_grading(UUID, UUID) TO authenticated;
