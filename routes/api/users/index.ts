import { HandlerContext } from "$fresh/server.ts";
import db from '../../../database/connectBD.ts';
import { UserSchema } from '../../../schema/user.ts';
import { create } from 'djwt';
import * as bcrypt from 'bcrypt';
import { key } from '../../../utils/apiKey.ts';
import { ObjectId } from 'mongo';


