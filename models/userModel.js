const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
     mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    // images: {
    //     type: String,
    //     required: true
    //   },
    is_admin:{
        type:Number,
        default:0
    },
    is_verified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    },
    blocked:{
        type:Boolean,
        default:false
    },
   

})

module.exports=mongoose.model('User',userSchema)