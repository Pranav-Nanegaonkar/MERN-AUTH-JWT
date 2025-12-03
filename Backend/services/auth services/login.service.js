const expressAsyncHander = require("express-async-handler");
const mm = require("../../utilities/globalModule");
const { nanoid } = require("nanoid");
const AppError = require("../../utilities/appError");

exports.login = expressAsyncHander(async (req, res) => {
  const request = {
    ...req.body,
    userAgent: req.headers["user-agent"],
  };

  // find user by email
  const user = await UserModel.findOne({ email: data.email });

  if (!user) {
    throw new AppError("Invalid credentials", UNAUTHORIZED);
  }

  // verify password
  const isPasswordValid = await user?.comparePassword(data.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", UNAUTHORIZED);
  }

  // create session
  const session = await SessionModel.create({
    userId: user._id,
    userAgent: data.userAgent,
  });

  // sign access token and refresh token
  // const refreshToken = jwt.sign(
  //   {
  //     sessionId: session._id,
  //   },
  //   JWT_REFRESH_SECRET,
  //   { audience: ["user"], expiresIn: "30d" }
  // );

  // const accessToken = jwt.sign(
  //   { userId: user._id, sessionId: session._id },
  //   JWT_SECRET,
  //   { audience: ["user"], expiresIn: "15m" }
  // );

  const refreshToken = signToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions
  );

  const accessToken = signToken(
    {
      userId: user._id,
      sessionId: session._id,
    },
    accessTokenSignOptions
  );

  const { password, ...userWithoutPassword } = user.toObject();

  // return user
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
});

exports.register = expressAsyncHander(async (req, res) => {
  const data = {
    ...req.body,
    userAgent: req.headers["user-agent"],
  };

  //verify if already exist
  const existingUser = await mm.executeQuery(
    `SELECT * FROM users where email=(?)`,
    [data?.email]
  );
  console.log(existingUser);

  if (existingUser.length >= 1) {
    throw new AppError("User already exists", 400);
  }

  //if not exist then crate user
  const newuserid = nanoid();
  const user = await mm.executeQuery(
    `INSERT INTO users (id,email,password) VALUES (?,?,?)`,
    [newuserid, data?.email, data?.password]
  );

  function getDatePlus15Minutes() {
    const now = new Date();

    // Add 15 minutes
    now.setMinutes(now.getMinutes() + 15);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Example
  console.log(getDatePlus15Minutes());

  // create verificaiton code
  //   const verificationCode = await mm.executeQuery(
  //     `INSERT INTO verificationcode (id,userId,type,expiresAt) VALUES (?,?,?,?)`,
  //     [nanoid(),]
  //   );

  // await VerificationCodeModel.create({
  //     userId: user._id,
  //     type: VerificationCodeType.EmailVerification,
  //     expiresAt: oneYearFromNow(),
  //   });

  res.json({
    user,
  });
});
