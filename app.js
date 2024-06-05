// database connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/projectdatabase')
    .then(() => console.log('connected with database'))
    .catch((err) => console.log('no connection', err));



// schema model
const Register = require("./models/userschema.js");
const product = require("./models/productschema.js");
const encodedimg = require('./models/imgtobase64.js')
const auth = require('./models/auth.js')

// express app setup
const express = require('express');
const app = express();
const port = 3000;



// multer setup
const multer=require('multer');
const storage = multer.diskStorage({
    destination : 'public/images/uploads',
    filename: (req,file,cb)=>{
        cb(null,file.originalname)
    }
})
const upload = multer({
    storage: storage,

})




// template setup
const path = require('path');
const staticpath = path.join(__dirname, '../public');
const templatepath = path.join(__dirname, '../templates/views');

app.use(express.static(staticpath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', templatepath);


// login route
app.get("/", (req, res) => {
    res.render("login.ejs");

});

app.post("/login", async (req, res) => {
    try {
       await Register.findOne({ email: req.body.email }).then(check=>{
        if (check.password == req.body.password) {
           
            if (check.role == 'admin') {
              res.redirect('/productinfo/'+check.role)
           
            
              }
             else {
             res.redirect('/home')
            }
        }
        else {
            res.send('incorrect password')
        }
       })
       
    } catch (error) {
        res.send('not found');
    }
   
});




// register route
app.get("/register", (req, res) => {
    res.render("register.ejs")


});

app.post('/register', async (req, res) => {
    try {

        const entry = new Register({
            name: req.body.name,
            dateofbirth: req.body.dob,
            address: req.body.address,
            contact: req.body.contact,
            email: req.body.email,
            password: req.body.password

        });
        if (entry.password == req.body.cpassword) {
            const registered = await entry.save();
            res.render('home.ejs');
        }
        else {
            res.render('register.ejs')
        }

    }
    catch (error) {
        res.status(400).send("no entry");
    }

});


// 
app.get("/home", (req, res) => {
    res.render('home.ejs');
 
  
   
    
   
});


//   admin route
// crud api
app.get('/productinfo/:role',auth('admin'), async (req, res) => {
   
    try {
        await product.find().then(data => {
            
             
            res.render('productinfo.ejs', { x: data })
     
         
          

            
        })


    } catch (error) {
        res.status(400).send("could not find data");
    }
});


// product management
// edit product route
app.get('/updateproduct/:id', async (req, res) => {

    try {
        await product.findById(req.params.id)
            .then(data => {
             
                res.render('updateproduct.ejs', { x: data });

            })

    } catch (error) {
        res.status(400).send("could not find data");
    }
})

// edit page
app.post('/updateproduct/:id',upload.single('productimage'), async (req, res) => {
    try {
        let file =  await encodedimg(req.file);
        await product.findByIdAndUpdate(req.params.id, {
            productname: req.body.productname,
            prize: req.body.prize,
            rating: req.body.rating,
            description: req.body.description,
            stock: req.body.stock,
            productimage: file,
            category: req.body.category
        })
   
        
        res.redirect('/productinfo')

    } catch (error) {
        res.status(400).send("could not find data");
    }
})




//   delete product route
app.get('/deleteproduct/:id', async (req, res) => {
    try {
        await product.findByIdAndDelete(req.params.id)
        res.redirect('/productinfo')
    } catch (error) {
        res.status(400).send("could not find data");
    }
})



// create product route
app.get('/addproduct',async(req,res)=>{
    res.render('addproduct.ejs');
})
app.post('/addproduct',upload.single('productimage'), async (req, res) => {
    let file =  await encodedimg(req.file)
   
   
   try {
        const entry = new product({
            productname: req.body.productname,
            prize: req.body.prize,
            rating: req.body.rating,
            description: req.body.description,
            stock: req.body.stock,
            productimage: file,
            category: req.body.category
        });
    
        await entry.save();
        res.redirect('/productinfo')

    } catch (error) {
        res.status(400).send("no entry");
    }
})

app.post('/home',async(req,res)=>{
   
    try {
        await product.find({"$or":[{"productname": {$regex: req.body.search}}]}).then(data=>{
            res.render('productcard.ejs', { x: data })
        })

    } catch (error) {
        res.status(400).send("could not find data");
    }

  
})

// product cards in webpage
app.get('/allproduct', async (req, res) => {
    try {
        await product.find().then(data=>{
            res.render('productcard.ejs', { x: data })
        })

    } catch (error) {
        res.status(400).send("could not find data");
    }

});
app.get('/productdetails/:id', async (req, res) => {
    try {
        await product.findById(req.params.id).then(data=>{
            res.render('productdetails.ejs',{i:data})
        })
        
    } catch (error) {
        res.status(400).send("could not find data");
    }
})




app.listen(port, () => {
    console.log(`server is running at${port}`);

});
