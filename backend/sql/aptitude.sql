CREATE TABLE IF NOT EXISTS aptitude_categories (
  category_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id),
  UNIQUE KEY aptitude_categories_name_unique (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS aptitude_topics (
  topic_id INT NOT NULL AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (topic_id),
  UNIQUE KEY aptitude_topics_category_name_unique (category_id, name),
  KEY aptitude_topics_category (category_id),
  CONSTRAINT aptitude_topics_category_fk
    FOREIGN KEY (category_id) REFERENCES aptitude_categories (category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS aptitude_notes (
  note_id INT NOT NULL AUTO_INCREMENT,
  topic_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (note_id),
  KEY aptitude_notes_topic (topic_id),
  CONSTRAINT aptitude_notes_topic_fk
    FOREIGN KEY (topic_id) REFERENCES aptitude_topics (topic_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS aptitude_quiz_attempts (
  attempt_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  topic_id INT NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL DEFAULT 0,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (attempt_id),
  KEY aptitude_attempts_user (user_id, completed_at),
  KEY aptitude_attempts_topic (topic_id, completed_at),
  CONSTRAINT aptitude_attempts_user_fk
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT aptitude_attempts_topic_fk
    FOREIGN KEY (topic_id) REFERENCES aptitude_topics (topic_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS aptitude_quiz_questions (
  question_id INT NOT NULL AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
  selected_option ENUM('A', 'B', 'C', 'D') NULL DEFAULT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id),
  KEY aptitude_questions_attempt (attempt_id),
  CONSTRAINT aptitude_questions_attempt_fk
    FOREIGN KEY (attempt_id) REFERENCES aptitude_quiz_attempts (attempt_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO aptitude_categories (name, description) VALUES
  ('Quantitative Aptitude', 'Build numerical fluency for placement assessments.'),
  ('Logical Reasoning', 'Practice structured reasoning and pattern recognition.'),
  ('Verbal Ability', 'Strengthen vocabulary, grammar, and comprehension.');

INSERT IGNORE INTO aptitude_topics (category_id, name, description) VALUES
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Number System', 'Understand integers, divisibility, factors, and remainders.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Number Series', 'Identify patterns and predict missing terms.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Percentages', 'Solve percentage change, comparison, and conversion problems.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Profit and Loss', 'Calculate cost price, selling price, profit, and loss.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Ratio and Proportion', 'Compare quantities and solve proportional relationships.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Averages', 'Use averages to reason about grouped values.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Time and Work', 'Model work rates and combined effort.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Time, Speed and Distance', 'Connect distance, speed, and travel time.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Simple Interest', 'Calculate interest using principal, rate, and time.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Compound Interest', 'Understand interest compounded over time.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Probability', 'Measure the likelihood of outcomes.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Permutation and Combination', 'Count arrangements and selections.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Quantitative Aptitude'), 'Data Interpretation', 'Extract insights from tables, charts, and graphs.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Coding-Decoding', 'Infer rules used to transform letters and numbers.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Blood Relations', 'Resolve family relationships from given clues.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Direction Sense', 'Track positions and direction changes.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Syllogism', 'Evaluate conclusions from stated premises.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Seating Arrangement', 'Arrange people using positional constraints.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Number/Alphabet Analogy', 'Recognize relationships between number or letter pairs.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Classification', 'Identify the item that does not share a common rule.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Logical Reasoning'), 'Logical Sequence', 'Order events or items using logical clues.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Vocabulary', 'Build practical word knowledge and usage.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Synonyms and Antonyms', 'Identify words with similar or opposite meanings.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Sentence Correction', 'Improve sentence structure, clarity, and correctness.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Error Detection', 'Find grammatical and usage errors in sentences.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Grammar', 'Practice rules that govern effective English.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Fill in the Blanks', 'Choose words that complete sentences accurately.'),
  ((SELECT category_id FROM aptitude_categories WHERE name = 'Verbal Ability'), 'Reading Comprehension', 'Understand and interpret written passages.');

INSERT INTO aptitude_notes (topic_id, title, content)
SELECT topic_id, 'Number Series: Core Patterns',
       CONCAT(
         'A number series is an ordered list built using one or more rules.\n\n',
         'Difference method\nFind differences between consecutive terms. For 3, 7, 13, 21, differences are 4, 6, 8, so the next difference is 10 and the next term is 31.\n\n',
         'Second differences\nIf first differences do not form a simple pattern, compare those differences. Constant second differences often indicate a quadratic pattern.\n\n',
         'Multiplication and division\nCheck for changing multipliers, such as 2, 6, 24, 120 (multiply by 3, 4, then 5).\n\n',
         'Squares, cubes, alternating, and mixed patterns\nCompare terms with familiar powers, split odd and even positions, or test a combination of operations. Verify a proposed rule against every term before choosing the answer.'
       )
FROM aptitude_topics t
WHERE t.name = 'Number Series'
  AND NOT EXISTS (
    SELECT 1 FROM aptitude_notes n
    WHERE n.topic_id = t.topic_id AND n.title = 'Number Series: Core Patterns'
  );