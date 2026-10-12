ALTER TABLE aptitude_topics
  ADD COLUMN difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium' AFTER description;

UPDATE aptitude_topics
SET difficulty = CASE name
  WHEN 'Number System' THEN 'Easy'
  WHEN 'Number Series' THEN 'Medium'
  WHEN 'Percentages' THEN 'Easy'
  WHEN 'Profit and Loss' THEN 'Medium'
  WHEN 'Ratio and Proportion' THEN 'Easy'
  WHEN 'Averages' THEN 'Easy'
  WHEN 'Time and Work' THEN 'Medium'
  WHEN 'Time, Speed and Distance' THEN 'Medium'
  WHEN 'Simple Interest' THEN 'Easy'
  WHEN 'Compound Interest' THEN 'Medium'
  WHEN 'Probability' THEN 'Hard'
  WHEN 'Permutation and Combination' THEN 'Hard'
  WHEN 'Data Interpretation' THEN 'Medium'
  WHEN 'Coding-Decoding' THEN 'Easy'
  WHEN 'Blood Relations' THEN 'Easy'
  WHEN 'Direction Sense' THEN 'Easy'
  WHEN 'Syllogism' THEN 'Medium'
  WHEN 'Seating Arrangement' THEN 'Hard'
  WHEN 'Number/Alphabet Analogy' THEN 'Easy'
  WHEN 'Classification' THEN 'Easy'
  WHEN 'Logical Sequence' THEN 'Medium'
  WHEN 'Vocabulary' THEN 'Easy'
  WHEN 'Synonyms and Antonyms' THEN 'Easy'
  WHEN 'Sentence Correction' THEN 'Medium'
  WHEN 'Error Detection' THEN 'Medium'
  WHEN 'Grammar' THEN 'Medium'
  WHEN 'Fill in the Blanks' THEN 'Easy'
  WHEN 'Reading Comprehension' THEN 'Hard'
  ELSE difficulty
END;

CREATE TABLE IF NOT EXISTS aptitude_practice_questions (
  question_id INT NOT NULL AUTO_INCREMENT,
  topic_id INT NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id),
  UNIQUE KEY aptitude_practice_question_unique (topic_id, difficulty, question_text(180)),
  KEY aptitude_practice_topic_difficulty (topic_id, difficulty),
  CONSTRAINT aptitude_practice_question_topic_fk
    FOREIGN KEY (topic_id) REFERENCES aptitude_topics (topic_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS aptitude_practice_attempts (
  attempt_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  topic_id INT NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NULL,
  difficulty_mode ENUM('Easy', 'Medium', 'Hard', 'Mixed') NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL DEFAULT 0,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  timer_seconds INT NULL,
  time_taken_seconds INT NULL,
  started_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (attempt_id),
  KEY aptitude_practice_attempts_user (user_id, completed_at),
  KEY aptitude_practice_attempts_topic (topic_id, completed_at),
  CONSTRAINT aptitude_practice_attempt_user_fk
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT aptitude_practice_attempt_topic_fk
    FOREIGN KEY (topic_id) REFERENCES aptitude_topics (topic_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS aptitude_practice_attempt_questions (
  attempt_question_id INT NOT NULL AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option ENUM('A', 'B', 'C', 'D') NULL DEFAULT NULL,
  PRIMARY KEY (attempt_question_id),
  UNIQUE KEY aptitude_practice_attempt_question_unique (attempt_id, question_id),
  CONSTRAINT aptitude_practice_attempt_question_attempt_fk
    FOREIGN KEY (attempt_id) REFERENCES aptitude_practice_attempts (attempt_id) ON DELETE CASCADE,
  CONSTRAINT aptitude_practice_attempt_question_bank_fk
    FOREIGN KEY (question_id) REFERENCES aptitude_practice_questions (question_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
