import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../connection.js';

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    use_in_menu: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'categories',
    tableName: 'categories',
    underscored: true,
    timestamps: true,
  },
);

export default Category;
