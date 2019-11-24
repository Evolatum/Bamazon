require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

var bamazon = {
    optionsDisplay:function(){
        inquirer.prompt([
            {
                type:"list",
                choices:["Display products", "Display low inventory", "Add stock to product", "Add new product", "Exit"],
                message: "Choose an option:",
                name: "choice"
            }
        ])
        .then(function(response) {
            switch(response.choice){
                case "Display products":
                    bamazon.showProducts(bamazon.optionsDisplay);
                    break;
                case "Display low inventory":
                    bamazon.displayLowInventory();
                    break;
                case "Add stock to product":
                    bamazon.showProducts(bamazon.askProductId);
                    break;
                case "Add new product":
                    bamazon.addProduct();
                    break;
                case "Exit":
                    console.log("\nExiting \x1b[1;36mBAMAZON\x1b[0m manager mode...");
                    connection.end();
                    break;
            }
        });
    },

    askProductId:function(){
        connection.query(
            `SELECT * FROM products;`,
            function(err, res) {
                if (err) throw err;
                inquirer.prompt([
                    {
                        message: "Choose a product by ID:",
                        validate:function(id){                            
                            if(!/^[0-9]+$/.test(id)||id<1||id>res.length)
                                return `Please select a number between 1 and ${res.length}.`

                            return true;
                        },
                        name: "productId"
                    }
                ])
                .then(function(response) {
                    bamazon.askProductNumber(response.productId);
                });
            }
        );
    },

    askProductNumber:function(productId){
        connection.query(
            `SELECT * FROM products WHERE id=${productId};`,
            function(err, res) {
                if (err) throw err;
                res = res[0];

                inquirer.prompt([
                    {
                        message: `How many ${res.product_name.endsWith("s")?res.product_name:res.product_name+"s"} do you want to add?`,
                        validate:function(number){
                            if(!/^[0-9]+$/.test(number)||number<1)
                                return `Please select a number above 1.`

                            return true;
                        },
                        name: "productNumber"
                    }
                ])
                .then(function(response) {
                    bamazon.managerHeader();
                    console.log("\x1b[32m",`\n${response.productNumber} ${res.product_name.endsWith("s")?res.product_name:res.product_name+"s"} added to inventory.\n`);
                    bamazon.increaseStock(productId,response.productNumber);
                    bamazon.optionsDisplay();
                });
            }
        );
    },

    showProducts:function(func){
        connection.query(
            `SELECT * FROM products;`,
            function(err, res) {
                bamazon.managerHeader();
                console.log(`\t      --- PRODUCTS TABLE ---`);
                console.log("\x1b[33m",`\n ------------------------------------------------\n`+
                            ` | ID\t| Product\t\t| Price\t| Stock\t|\n`+
                            ` | ---\t| ---------------------\t| -----\t| -----\t|`);
                for(let product of res){
                    console.log(` | ${product.id}\t| ${product.product_name.length<14?product.product_name+"\t":product.product_name}\t| `+
                                `${product.price}\t| ${product.stock_quantity===0?`\x1b[31m${product.stock_quantity}\x1b[33m`:product.stock_quantity}\t|`);
                }
                console.log(` ------------------------------------------------\n`,"\x1b[0m");
                func();
            }
        );
    },

    displayLowInventory:function(){
        connection.query(
            `SELECT * FROM products WHERE stock_quantity<11;`,
            function(err, res) {
                bamazon.managerHeader();
                console.log(`\t      --- PRODUCTS TABLE ---`);
                console.log("\x1b[33m",`\n ------------------------------------------------\n`+
                            ` | ID\t| Product\t\t| Price\t| Stock\t|\n`+
                            ` | ---\t| ---------------------\t| -----\t| -----\t|`);
                for(let product of res){
                    console.log(` | ${product.id}\t| ${product.product_name.length<14?product.product_name+"\t":product.product_name}\t| `+
                                `${product.price}\t| ${product.stock_quantity===0?`\x1b[31m${product.stock_quantity}\x1b[33m`:product.stock_quantity}\t|`);
                }
                console.log(` ------------------------------------------------\n`,"\x1b[0m");
                bamazon.optionsDisplay();
            }
        );
    },

    increaseStock:function(id, toAdd){
        connection.query(
            `UPDATE products SET stock_quantity = stock_quantity + ${toAdd} WHERE id = ${id};`,
            function(err, res) {
                if (err) throw err;
            }
        );
    },

    addProduct:function(){
        bamazon.managerHeader();
        inquirer.prompt([
            {
                message: "Product name:",
                name: "name"
            },
            {
                message: "Department:",
                name: "department"
            },
            {
                message: "Price:",
                validate:function(num){                            
                    if(!(/^[0-9].+$/.test(num)||/^[0-9]+$/.test(num))||num<0)
                        return `Please select a number above 0.`

                    return true;
                },
                name: "price"
            },
            {
                message: "Initial stock:",
                validate:function(num){                            
                    if(!/^[0-9]+$/.test(num)||num<0)
                        return `Please select a positive number or 0.`

                    return true;
                },
                name: "stock"
            }
        ])
        .then(function(response) {
            bamazon.managerHeader();
            console.log(`\x1b[33m${response.name}\x1b[0m added to the \x1b[33m${response.department}\x1b[0m department,\n`+
                        `with an initial stock of \x1b[33m${response.stock}\x1b[0m and a price of \x1b[33m${parseFloat(response.price).toFixed(2)}\x1b[0m each.\n`);
            bamazon.addProductToDB(response);
            bamazon.optionsDisplay();
        });
    },

    addProductToDB:function(obj){
        connection.query(
            `INSERT INTO products SET ?;`,
            {
                product_name:obj.name, 
                department_name:obj.department, 
                price:parseFloat(obj.price).toFixed(2), 
                stock_quantity:parseInt(obj.stock)
            },
            function(err, res) {
                if (err) throw err;
            }
        );
    },

    managerHeader:function(){
        process.stdout.write("\u001b[2J\u001b[0;0H");
        console.log(`\n\t    --- \x1b[1;36mBAMAZON\x1b[0m MANAGER MODE--- \n`);
    }
}

bamazon.managerHeader();
bamazon.optionsDisplay();