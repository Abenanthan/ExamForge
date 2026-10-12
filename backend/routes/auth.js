const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db');

const router = express.Router();

// ================================
// REGISTER
// ================================

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email],
      async (err, results) => {
        if (err) {
          return res.status(500).json({
            message: 'Database error',
            error: err.message
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            message: 'Email already registered'
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          `INSERT INTO users (name, email, password, role)
           VALUES (?, ?, ?, 'student')`,
          [name, email, hashedPassword],
          (err, result) => {
            if (err) {
              return res.status(500).json({
                message: 'Failed to create account',
                error: err.message
              });
            }

            res.status(201).json({
              message: 'Account created successfully!',
              user_id: result.insertId
            });
          }
        );
      }
    );

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});


// ================================
// LOGIN
// ================================

router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      message: 'Email, password and role are required'
    });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {

      if (err) {
        return res.status(500).json({
          message: 'Database error',
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      const user = results[0];

      // Check role
      if (user.role !== role) {
        return res.status(401).json({
          message: 'Invalid login role'
        });
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
      );

      res.json({
        message: 'Login successful!',
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

module.exports = router;