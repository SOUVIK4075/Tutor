require('dotenv').config()
const express=require('express')
const app=express()    //-->> project instance
const mongoose=require('mongoose')  
const path=require('path')
const methodOverride=require('method-override')
const ejsMate=require('ejs-mate')
const ExpressError=require('./utils/ExpressError')
const tutorRoutes=require('./routes/tutors')
const reviewRoutes=require('./routes/reviews')
const userRoutes=require('./routes/user')
const session=require('express-session')
const flash=require('connect-flash')
const passport=require('passport')
const LocalStrategy=require('passport-local');
const User=require('./models/user')

const PORT = process.env.PORT || 8080

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(process.env.MONGO_URL);
}

app.engine('ejs', ejsMate)
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))   //--> frontend load in this path

app.use(express.urlencoded({extended: true}))   
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,'public')))  //--->> all static things attached with public folder

const sessionConfig = {   //__. remember the user in this time
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())     //--> 

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req,res,next) => {      //-->> Middleware  , check if any user are there
    res.locals.currentUser=req.user
    res.locals.returnTo=''
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    next()
})

app.use('/tutors', tutorRoutes)      //-->> see again
app.use('/tutors/:id/reviews', reviewRoutes)
app.use('/', userRoutes)

app.get('/', (req,res) => {
    res.render('tutors/home')
})

app.all('*', (req,res,next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err,req,res,next) => {
    const {statusCode=500}=err
    if(!err.message || statusCode===500)    err.message='Oh No! Something Went Wrong!'
    res.status(statusCode).render('error', {err})
})


app.listen(8080, () => {
    console.log("Server running on Port 8080!")
})