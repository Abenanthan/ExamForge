CREATE TABLE IF NOT EXISTS coding_challenges (
  challenge_id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  input_format TEXT NOT NULL,
  output_format TEXT NOT NULL,
  `constraints` TEXT NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id),
  KEY created_by (created_by),
  CONSTRAINT coding_challenges_ibfk_1
    FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS coding_test_cases (
  test_case_id INT NOT NULL AUTO_INCREMENT,
  challenge_id INT NOT NULL,
  input_data TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (test_case_id),
  KEY challenge_id (challenge_id),
  CONSTRAINT coding_test_cases_ibfk_1
    FOREIGN KEY (challenge_id) REFERENCES coding_challenges (challenge_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS coding_submissions (
  submission_id INT NOT NULL AUTO_INCREMENT,
  challenge_id INT NOT NULL,
  user_id INT NOT NULL,
  language ENUM('Java', 'Python', 'C') NOT NULL,
  source_code MEDIUMTEXT NOT NULL,
  status ENUM('Queued', 'Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Execution Error') NOT NULL DEFAULT 'Queued',
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  passed_tests INT NOT NULL DEFAULT 0,
  total_tests INT NOT NULL DEFAULT 0,
  execution_time DECIMAL(8,3) NULL DEFAULT NULL,
  submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (submission_id),
  KEY challenge_id (challenge_id),
  KEY user_id (user_id),
  KEY user_challenge_submitted (user_id, challenge_id, submitted_at),
  CONSTRAINT coding_submissions_ibfk_1
    FOREIGN KEY (challenge_id) REFERENCES coding_challenges (challenge_id) ON DELETE CASCADE,
  CONSTRAINT coding_submissions_ibfk_2
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;