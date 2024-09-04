const Member = require("../models/member");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const registration = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({
        message: errors.mapped(),
      });

    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await Member.create(email, hashedPassword, first_name, last_name);

    return res.status(200).json({
      status: 0,
      message: "Registrasi berhasil silahkan login",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: 1,
      message: error.message,
      data: null,
    });
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({
        message: errors.mapped(),
      });

    const { email, password } = req.body;
    const [member] = await Member.getMemberByEmail(email);
    const match = await bcrypt.compare(password, member[0].password);

    if (!match)
      return res.status(401).json({
        status: 1,
        message: "Username atau password salah",
        data: null,
      });

    const token = jwt.sign(
      {
        id: member[0].id,
        first_name: member[0].first_name,
        last_name: member[0].last_name,
        email: member[0].email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "12",
      }
    );

    return res.status(200).json({
      status: 0,
      message: "Login sukses",
      data: {
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 1,
      message: error.message,
      data: null,
    });
  }
};

const validate = (method) => {
  switch (method) {
    case "registration": {
      return [
        body("email")
          .notEmpty()
          .withMessage("Email tidak boleh kosong")
          .isEmail()
          .withMessage("Parameter email tidak sesuai format")
          .custom(async (email) => {
            const [row] = await Member.getMemberByEmail(email);
            if (row[0]) {
              throw new Error("Email telah terdaftar!");
            }
            return true;
          }),
        body("password")
          .notEmpty()
          .withMessage("Password tidak boleh kosong")
          .isLength({ min: 8 })
          .withMessage("Password minimal 8 karakter"),
        body("first_name")
          .notEmpty()
          .withMessage("First name tidak boleh kosong"),
        body("last_name")
          .notEmpty()
          .withMessage("Last name tidak boleh kosong"),
      ];
    }
    case "login": {
      return [
        body("email")
          .notEmpty()
          .withMessage("Email tidak boleh kosong")
          .isEmail()
          .withMessage("Parameter email tidak sesuai format")
          .custom(async (email) => {
            const [row] = await Member.getMemberByEmail(email);
            if (!row[0]) {
              throw new Error("Username atau password salah");
            }
            return true;
          }),
        body("password").notEmpty().withMessage("Password tidak boleh kosong"),
      ];
    }

    default:
      break;
  }
};

module.exports = {
  login,
  registration,
  validate,
};
