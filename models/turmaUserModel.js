import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../connection.js';
import bcrypt from "bcrypt";

class User extends Model {}

User.init(
  {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    lastName: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'User'
  },
);

User.beforeCreate(async (user, options)=>{
    const newPassword = await bcrypt.hash(user.password, 10)
    user.password = newPassword;
})

export default User