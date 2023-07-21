// const isLogin =async(req,res,next)=>{
//    try{

//     if(req.session.user_id){
       
//         console.log(req.session.user_id);
       
//      } 
//      else if (req.session.user_id === 'blocked') {
//         res.render('users/block');
//     }
    
//       else{res.redirect('/login')    
//     }
//     next();
//    }catch(error){
//     console.log(error.message)
//    } 
// }
const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id === 'blocked') {
      res.render('users/block');
    } else if (req.session.user_id) {
    } else {
      res.redirect('/login');
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};





const isLogout =async(req,res,next)=>{
  try{

      if(req.session.user_id){
          res.redirect('/home')
      }
      next()
 
  }catch(error){
 console.log(error.message)
  } 
}

module.exports={
  isLogin,
  isLogout,
 
}