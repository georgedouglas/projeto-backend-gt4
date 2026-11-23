import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../connection.js';
import Category from './categoryModel.js';

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_with_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'products',
    tableName: 'products',
    underscored: true,
    timestamps: true,
  },
);

class ProductImage extends Model {}

ProductImage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    path: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'product_images',
    tableName: 'product_images',
    underscored: true,
    timestamps: true,
  },
);

class ProductOption extends Model {}

ProductOption.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shape: {
      type: DataTypes.ENUM('square', 'circle'),
      allowNull: false,
      defaultValue: 'square',
    },
    radius: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    type: {
      type: DataTypes.ENUM('text', 'color'),
      allowNull: false,
      defaultValue: 'text',
    },
    values: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'product_options',
    tableName: 'product_options',
    underscored: true,
    timestamps: true,
  },
);

class ProductCategory extends Model {}

ProductCategory.init(
  {
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'categories', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'product_categories',
    tableName: 'product_categories',
    underscored: true,
    timestamps: false,
  },
);

Product.hasMany(ProductImage, { as: 'images', foreignKey: 'product_id' });
Product.hasMany(ProductOption, { as: 'options', foreignKey: 'product_id' });
Product.belongsToMany(Category, {
  as: 'categories', through: ProductCategory, foreignKey: 'product_id', otherKey: 'category_id'
});

export {
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
};
