DROP DATABASE IF EXISTS bamazon_db;

CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(45) NOT NULL,
  department_name VARCHAR(45) NULL,
  price DECIMAL(10,2) NULL,
  stock_quantity INT NULL
);

select * from products;

INSERT INTO products (product_name, department_name, price, stock_quantity ) VALUES
("Eko Dot", "Electronics", 50, 28),
("Wireless Rat", "Electronics", 9.99, 30),
("Mike Shoes", "Apparel", 60, 4),
("The Tritons of Titan", "Books", 20, 6),
("Seven of Crows", "Books", 23.99, 5),
("Watt-er Bottles", "Food", 1.99, 218),
("Bjango Bjango", "Music", 9.99, 10),
("King Battery", "Music", 8.99, 8),
("Outside In", "Movies", 19.99, 6),
("Into the Multipoetry", "Movies", 24.49, 8);