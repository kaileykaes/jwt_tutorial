import { create } from 'djwt';
import { key } from '../src/utils/apiKey.ts';
import { Request, Response } from 'oak';
import { UserSchema } from '../schema/user.ts';
import * as bcrypt from 'bcrypt';
import db from '../database/connectBD.ts';

const Users = db.collection<UserSchema>('users');

//create a user
export const signup = async (
  { request, response }: { request: Request; response: Response },
) => {
  const { username, password } = await request.body().value;
  const salt = await bcrypt.genSalt(8);
  const hashedPassword = await bcrypt.hash(password, salt);

  const _id = await Users.insertOne({
    username,
    password: hashedPassword,
  });
  response.status = 201;
  response.body = { message: 'User created', userId: _id, user: username };
};

//sign in a user
export const signin = async (
  { request, response }: { request: Request; response: Response },
) => {
  const body = await request.body();
  const { username, password } = await body.value;

  const user = await Users.findOne({ username });

  if (!user) {
    response.body = 404;
    response.body = { message: `user "${username}" not found` };
    return;
  }
  const confirmPassword = await bcrypt.compare(password, user.password);
  if (!confirmPassword) {
    response.body = 404;
    response.body = { message: 'Incorrect password' };
    return;
  }

  //authenticate a user
  const payload = {
    id: user._id,
    name: username,
  };
  const jwt = await create({ alg: 'HS512', typ: 'JWT' }, { payload }, key);

  if (jwt) {
    response.status = 200;
    response.body = {
      userId: user._id,
      username: user.username,
      token: jwt,
    };
  } else {
    response.status = 500;
    response.body = {
      message: 'internal server error',
    };
  }
  return;
};
