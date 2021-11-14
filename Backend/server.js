const express = require('express');
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const initializePassport = require('./passport-config.js');
const User = require('./models/user_model.js');
const Restaurant = require('./models/restaurant_model.js');
const Product = require('./models/product_model.js')
const Location = require('./models/location_model.js')
const Cart = require('./models/cart_model.js')
const Order = require('./models/order_model.js')
var ObjectId = require('mongodb').ObjectId;
var haversine = require("haversine-distance");
const methodOverride = require('method-override');
const path = require('path')
var fs = require('fs');

const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");


const passport = require("./passport-config");
const session = require('express-session');




var MONGO_URI = "mongodb+srv://Zwiggy:Zwiggy%4012@cluster0.hxvrl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


mongoose
    .connect(MONGO_URI, { useNewUrlParser: true })
    .then(console.log(`MongoDB connected ${MONGO_URI}`))
    .catch(err => console.log(err));


const app = express();

app.set('views', path.join('../Frontend/Views'))
app.use(express.static('../Frontend/public'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(methodOverride('_method'))
app.use(express.json({ limit: '1mb' }))


app.use(
    session({
        secret: "very secret this is",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: MONGO_URI
        })
    })
);

app.use(passport.initialize())
app.use(passport.session())

app.use(express.static(path.join(__dirname, 'main')));


var multer = require('multer');
const cart_model = require('./models/cart_model.js');
const { Http2ServerResponse } = require('http2');
const { prototype } = require('module');

var storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
})

var upload = multer({ storage: storage });

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = new User();
        user.email = req.body.email;
        user.password = hashedPassword;
        user.usertype = "user"

        user.save(function (err, data) {
            if (err) {
                console.error(err);
            } else {
                res.redirect('/')
            }
        })
    } catch (e) {
        console.error(e);
        res.redirect('/homepage')
    }
})



app.get('/homepage', checkNotAuthenticated, (req, res) => {
    res.render('homepage.ejs')
})


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/homepage')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}


app.get('/', checkAuthenticated, (req, res) => {
    console.log(req.user.email)
    res.render('foodPage.ejs', { name: req.user.email })
})
app.get('/', checkNotAuthenticated, (req, res) => {
    res.render('homepage.ejs')
})

app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => { res.redirect('/') })

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/foodPage',
    failureRedirect: '/restaurant/register',
    failureFlash: true
}))

app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))


app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/homepage')
})




app.post('/restaurant/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const restaurant = new Restaurant();
        restaurant.email = req.body.email;
        restaurant.password = hashedPassword;
        restaurant.phone = req.body.phone;
        restaurant.name = req.body.name;
        restaurant.longitude = req.body.longitude;
        restaurant.latitude = req.body.latitude;
        restaurant.usertype = "restaurant";

        restaurant.save(function (err, data) {
            if (err) {
                console.error(err);
            } else {
                res.redirect('/restaurant/login')
            }
        })
    } catch (e) {
        console.error(e);
        res.redirect('/homepage')
    }
})

app.get('/restaurant/register', (req, res) => {
    res.render("restaurant_register.ejs")
})

app.get('/restaurant/login', (req, res) => {
    res.render("restaurant_login.ejs")
})

app.post('/restaurant/login', checkNotAuthenticated, passport.authenticate('restaurant_local', {
    successRedirect: '/',
    failureRedirect: '/homepage',
    failureFlash: true
}))

app.post('/restaurant/add_product', upload.single('uploaded_file'), (req, res) => {
    try {
        const product = new Product();
        product.name = req.body.name;
        product.price = req.body.price;
        product.restaurant = req.user.id;
        product.image = {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }

        product.save(function (err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log(data.id)
                Restaurant.updateOne({ id: req.user.id }, { $push: { 'products': [data.id] } })
                res.redirect('/restaurant/add_product')
            }
        })
    } catch (err) {
        console.log(err)
        res.redirect('/restaurant/add_product')
    }
})


function checkRestaurentAuth(req, res, next) {
    console.log("Yo")
    if (req.isAuthenticated()) {
        console.log('yo')
        console.log(req.user.id)
        Restaurant.findOne({ email: req.user.email }, '-salt -password', function (err, user) {
            if (!user) {
                res.redirect('/restaurant/login')
            }
        })

        return next()
    }

    res.redirect('/restaurant/login')
}

app.get('/restaurant/add_product', (req, res) => {
    res.render('add_product.ejs')
})


app.post('/updateuserlocation', async (req, res) => {
    try {
        console.log(req.body)

        Location.findOne({ userid: req.user.id }, function (err, location) {
            if (!location) {
                const location = new Location();
                location.userid = req.user.id;
                location.longitude = req.body.longitude;
                location.latitude = req.body.latitude;

                location.save(function (err, data) {
                    if (err) {
                        console.error(err);
                    } else {
                        res.redirect('/')
                    }
                })
            } else {
                location.longitude = req.body.longitude;
                location.latitude = req.body.latitude;

                location.save(function (err, data) {
                    if (err) {
                        console.error(err);
                    } else {
                        res.redirect('/')
                    }
                })
            }
        })
    } catch (e) {
        console.error(e);
        res.redirect('/')
    }
})



app.post('/restaurant/order', checkAuthenticated, (req, res) => {
    Cart.findOne({ user: req.user.id }, async function (err, cart) {
        if (!cart) {
            res.json('Error!')
        } else {
            const order = new Order()
            order.user = req.user.id
            order.products = cart.products

            var restaurants = []

            for (var i = 0; i < cart.products.length; i++) {
                const product = await Product.findOne({ "_id": ObjectId(cart.products[i]) })
                console.log(product)
                restaurants.push(product.restaurant)
            }

            console.log(restaurants)

            order.restaurants = restaurants
            order.price_total = cart.price

            order.save(function (err, data) {
                res.json(data)
            })
        }
    })


})

app.post('/add_to_cart', (req, res) => {
    console.log(req.body)

    try {
        Cart.findOne({ user: req.user.id }, (function (err, cart) {
            if (!cart) {
                const cart = new Cart();
                cart.user = req.user.id;
                cart.products = [req.body.product_id];
                cart.price_total = req.body.product_price;

                cart.save(function (err, data) {
                    if (err) {
                        console.log(err)
                    } else {
                        res.json("Done")
                    }
                })
            } else {
                console.log(cart.id)
                Cart.updateOne({ user: cart.user }, { $push: { 'products': [req.body.product_id] } }, function (err, cart) {
                    console.log(cart)
                })
                cart.price_total += req.body.product_price

                cart.save(function (err, data) {
                    if (err) {
                        console.log(err)
                    } else {
                        res.json("Done")
                    }
                })
            }
        }))
    } catch {
        return Http2ServerResponse("Wrong")
    }
})



app.get('/get_food', checkAuthenticated, async (req, res) => {

    var valid_restaurants = []
    var result = []

    Location.findOne({ user: req.user.id }, async function (err, location) {
        if (!location) {
            res.redirect('/')
        } else {
            const restaurants = await Restaurant.find()

            var user_location = { lat: location.latitude, lng: location.longitude }

            for (var i = 0; i < restaurants.length; i++) {
                f = restaurants[i]

                var restaurant_location = { lat: f.latitude, lng: f.longitude }
                var distance = haversine(user_location, restaurant_location) / 1000

                if (distance < 3) {
                    valid_restaurants.push(f)
                }
            }

            for (var i = 0; i < valid_restaurants.length; i++) {
                result.push(valid_restaurants[i].products)
            }

            res.json(result)
        }
    })
})



app.get('/restaurant/see_orders', checkAuthenticated, async (req, res) => {
    var result = []

    var order = await Order.find({ user: req.user.id })

    res.json(order)
})

//const port = process.env.PORT || 8000;
app.listen(process.env.PORT, () => {
    console.log(`Server is up and running on  https://zwiggy-food-delivery.herokuapp.com/`);
});

