
DROP POLICY IF EXISTS "questions_select_all" ON public.questions;

CREATE POLICY "questions_select_admin"
ON public.questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_exam_questions(p_exam_id uuid)
RETURNS TABLE (
  id uuid,
  exam_id uuid,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  q_position int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.exam_id, q.question_text,
         q.option_a, q.option_b, q.option_c, q.option_d, q.position
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
    AND auth.uid() IS NOT NULL
  ORDER BY q.position;
$$;

REVOKE ALL ON FUNCTION public.get_exam_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_exam_questions(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS TABLE (score int, total int, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student uuid;
  v_exam uuid;
  v_status text;
  v_total int;
  v_score int;
  v_pct numeric;
BEGIN
  SELECT student_id, exam_id, status
    INTO v_student, v_exam, v_status
  FROM public.attempts WHERE id = p_attempt_id;

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_student <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_status = 'submitted' THEN
    RAISE EXCEPTION 'Attempt already submitted';
  END IF;

  SELECT COUNT(*) INTO v_total FROM public.questions WHERE exam_id = v_exam;

  SELECT COUNT(*) INTO v_score
  FROM public.attempt_answers aa
  JOIN public.questions q ON q.id = aa.question_id
  WHERE aa.attempt_id = p_attempt_id
    AND aa.selected_answer = q.correct_answer;

  v_pct := CASE WHEN v_total > 0 THEN (v_score::numeric / v_total) * 100 ELSE 0 END;

  UPDATE public.attempts
  SET score = v_score,
      total = v_total,
      percentage = v_pct,
      status = 'submitted',
      submitted_at = now()
  WHERE id = p_attempt_id;

  RETURN QUERY SELECT v_score, v_total, v_pct;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_attempt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_attempt(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt_id uuid)
RETURNS TABLE (
  question_id uuid,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  q_position int,
  selected_answer char,
  correct_answer char
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student uuid;
  v_status text;
BEGIN
  SELECT student_id, status INTO v_student, v_status
  FROM public.attempts WHERE id = p_attempt_id;

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_student <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_status <> 'submitted' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Attempt not submitted yet';
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
         q.position, aa.selected_answer, q.correct_answer
  FROM public.questions q
  LEFT JOIN public.attempt_answers aa
    ON aa.question_id = q.id AND aa.attempt_id = p_attempt_id
  WHERE q.exam_id = (SELECT exam_id FROM public.attempts WHERE id = p_attempt_id)
  ORDER BY q.position;
END;
$$;

REVOKE ALL ON FUNCTION public.get_attempt_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attempt_review(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
