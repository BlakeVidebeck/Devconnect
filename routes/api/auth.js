const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   GET api/auth
// @desc    View profiles using token from register or login
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   POST api/auth
// @desc    Authenticate/Login user & get token
// @access  Public
router.post(
	'/',
	[
		body('email', 'Please include a valid email').isEmail(),
		body('password', 'Password is required').exists()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;

		try {
			// find user from email entered
			let user = await User.findOne({ email });

			if (!user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid Credentials' }] });
			}

			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid Credentials' }] });
			}
			// send user id with token that is created
			const payload = {
				user: {
					id: user.id
				}
			};

			jwt.sign(
				payload,
				process.env.jwtSecret,
				{ expiresIn: 360000 },
				(err, token) => {
					if (err) throw err;
					// return the token
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);

module.exports = router;
