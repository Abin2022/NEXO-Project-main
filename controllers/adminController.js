
const User = require("../models/userModel")
const bcrypt=require('bcrypt')
const Product=require("../models/productModel")

const fs = require('fs')
//multer
const multer = require("multer");
const path = require("path");
const express = require("express");
const router = express.Router();

const { userLogout } = require("./userController");

const Category = require("../models/categoryModel");
const { log } = require("handlebars/runtime");
const Order = require('../models/orderModel')
const moment = require("moment-timezone")
const mongoose=require("mongoose")

const ObjectId = mongoose.Types.ObjectId;
const categoryHelpers=require("../helpers/categoryHelpers")


const loadLogin =async(req,res)=>{
    try{
        res.render('admin/login')
    }catch(error){
        console.log(error.message);
    }
}

const verifyLogin = async(req,res)=>{
    try{
       const email=req.body.email
       const password= req.body.password

        const userData=await User.findOne({email:email})
        console.log(userData);
        if(userData){
            const passwordMatch= await bcrypt.compare(password,userData.password)
             
              if(passwordMatch){
                  if(userData.is_admin===0){
                    res.render('admin/login',{
                      message:"You Do Not Have Acess"
                    })
                  }else{
                     req.session.user_id =userData._id
                    console.log(req.session.user_id);
                     res.redirect('/admin/home')
                  }
              }
        }else{
            res.render('admin/login',{
              message:"Email and Password Don't Match"

            })
        }
    }catch(error){
        console.log(error.message);
    }
}


const loadDashboard=async(req,res)=>{
    try{
        User.findById({_id:req.session.user_id})
     res.render('admin/home')
    }catch(error){
     console.log(error.message);
    }
}

const adminLogout = async(req,res)=>{
    try{
       req.session.destroy()
       res.redirect('admin')
    }catch(error){
      console.log(error.message);
    }
  }

  const loadProducts = async (req, res) => {
    try {
      const updateProducts = await Product.find().lean();
      const productWithSerialNumber = updateProducts.map((products, index) => ({
        ...products,serialNumber: index + 1,
      }));
      const categories = await Category.find().lean();
      res.render("admin/add-products", {
        // layout: "admin-layout",
        products: productWithSerialNumber,
        categories: categories,
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const insertProducts = async (req, res) => {
    try {
       var arrayImage=[]
      for (let i = 0; i < req.files.length; i++) {
        arrayImage[i] = req.files[i].filename;
      }
      

      const newProduct = new Product({
        brand: req.body.brand,
        productname: req.body.productname,
        category: req.body.category,
        price: req.body.price,
        images: arrayImage,
        // images: req.file.filename,
        // images: req.files.map(file => file.filename),
        description: req.body.description,
      });
  
      const addProductData = await newProduct.save();
      console.log(addProductData);
      if (addProductData) {
        await Category.updateOne(
          {
            category: req.body.category,
          },
          {
            $push: { products: newProduct._id },
          }
        );
        const updateProducts = await Product.find().lean();
        const productWithSerialNumber = updateProducts.map((products, index) => ({
          ...products,
          serialNumber: index + 1,
        }));
        const categories = await Category.find().lean();
        res.render("admin/add-products", {
          products: productWithSerialNumber,
          categories: categories,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };


const editProduct = async (req, res) => {
  try {
    const id = req.query.id;

    const categories = await Category.find({ unlist: false }).lean();
    const categoryData = {};
    categories.forEach((data) => {
      categoryData[data._id.toString()] = {
        _id: data._id.toString(),
        category: data.category,
      };
    });


    const categoryLookup = [];
    categories.forEach((category) => {
      categoryLookup[category._id.toString()] = category.category;
    });

    // Define the lookupCategory helper function
    const lookupCategory = function (categoryId) {
      console.log("categoryId:", categoryId);
      console.log("categoryLookup:", categoryLookup);
      return categoryLookup[categoryId];
    };

    const updatedProduct = await Product.findById(id).lean();
    console.log(lookupCategory(updatedProduct.category), "lookupCategory");
    console.log(categoryLookup);
    console.log(updatedProduct.category);
    console.log(updatedProduct);
    console.log("updatedProduct.category:", updatedProduct.category);
    console.log("categoryLookup keys:", Object.keys(categoryLookup));

    if (updatedProduct) {
      const productWithCategoryName = {
        ...updatedProduct,
        category: lookupCategory(updatedProduct.category),
      };
      console.log('nantha santhappan',productWithCategoryName);

      res.render("admin/edit-product", {
        product: productWithCategoryName,
        categories: categoryData,
      });
    } else {
      console.log("Product not found");
      res.redirect("/admin/products");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteimg = async (req, res) => {
  try {
    const { imgName, productId } = req.body;
    console.log(req.body);
    console.log(productId);
    const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
    console.log(isValidObjectId);

    if (!isValidObjectId) {
      return res.status(400).json({ success: false, error: 'Invalid product ID.' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    console.log(product);

    // Find the index of the image with the specified imgName
    const imageIndex = product.images.findIndex((image) => image === imgName);

    // If the image exists, remove it from the images array
    if (imageIndex !== -1) {
      product.images.splice(imageIndex, 1);
      await product.save();
      console.log('Image removed successfully');
    } else {
      console.log('Image not found');
    }

    res.status(200).json({ success: true, message: 'Image deleted successfully.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Image deletion failed.' });
  }
};



// console.log(product);


const updateProduct = async (req, res) => {
  console.log("Enterd into updateProduct.....");
  try {
     //here###
     var arrayImage=[]
     for (let i = 0; i < req.files.length; i++) {
       arrayImage[i] = req.files[i].filename;
     }
     console.log(arrayImage,"arrayimag");
    const id = req.body.id;
    const updatedProduct = {
      brand: req.body.brand,
      productname: req.body.productname,
      category: req.body.category,
      price: req.body.price,
      images: req.body.images,
      images: arrayImage,
      description: req.body.description,
    };
    console.log("updatedProduct",updateProduct);
    await Product.findByIdAndUpdate(id, updatedProduct);
    res.redirect("/admin/home");
  } catch (error) {
    console.log(error.message);
  }
};

// const updateProduct = async (req, res) => {
//   console.log("Entered into updateProduct...");
//   try {
//     var arrayImage = [];
//     if (req.files && req.files.length) {
//       for (let i = 0; i < req.files.length; i++) {
//         arrayImage[i] = req.files[i].filename;
//       }
//     }
//     console.log(arrayImage, "arrayImage");
//     const id = req.body.id;
//     const updatedProduct = {
//       brand: req.body.brand,
//       productname: req.body.productname,
//       category: req.body.category,
//       price: req.body.price,
//       images: arrayImage,
//       description: req.body.description,
//     };
//     console.log("updatedProduct", updatedProduct);
//     await Product.findByIdAndUpdate(id, updatedProduct);
//     res.redirect("/admin/home");
//   } catch (error) {
//     console.log(error.message);
//   }
// };













const unlistProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findByIdAndUpdate(
      id,
      { $set: { unlist: true } }
    );
    res.redirect("/admin/add-products");
  } catch (error) {
    console.log(error.message);
  }
};

const listProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findByIdAndUpdate(
      id,
      { $set: { unlist: false } }
    );
    res.redirect("/admin/add-products");
  } catch (error) {
    console.log(error.message);
  }
};










  
  const loadCategory = async (req, res) => {
    try {
      const updatedcategory = await Category.find().lean();
      const categoryWithSerialNumber = updatedcategory.map((category, index) => ({
        ...category,
        serialNumber: index + 1,
      }));
      res.render("admin/category", {
        category: categoryWithSerialNumber,
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const addCategory = async (req, res) => {
    try {
      const category = req.body.category.toUpperCase();
  
      const existingCategory = await Category.findOne({
        category: { $regex: new RegExp("^" + category + "$", "i") },
      });
      if (existingCategory) {
        const errorMessage = "category already exits";
        const updatedcategory = await Category.find().lean();
        const categoryWithSerialNumber = updatedcategory.map(
          (category, index) => ({
            ...category,
            serialNumber: index + 1,
          })
        );
  
        return res.render("admin/category", {
          category: categoryWithSerialNumber,
          error: errorMessage,
        });
      }
      const newCategory = new Category({
        category: category,
      });
      const categories = await newCategory.save();
      return res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
  };
 
  // edit category
  // const editCategory = async (req, res) => {
  //   try {
  //     const { category: editCategory } = req.body;
  //     const categoryId = req.params.id; 
  
  //     const existingCategory = await Category.findById(categoryId);
  //     if (!existingCategory) {
  //       const errorMessage = "Category not found";
  //       const categories = await Category.find().lean();
  //       const categoriesWithSerialNumber = categories.map((category, index) => ({
  //         ...category,
  //         serialNumber: index + 1,
  //       }));
  
  //       return res.render("admin/category", {
  //         category: categoriesWithSerialNumber,
  //         error: errorMessage,
  //       });
  //     }
  
  //     existingCategory.category = updatedCategory;
  //     const updatedCategory = await existingCategory.save();
  
  //     return res.redirect("/admin/category");
  //   } catch (error) {
  //     console.log(error.message);
  //   }
  // };


  //edit un
  const editCategoryLoad = async(req,res)=>{
    try {
      await categoryHelpers.editingCategoryPageLoad(req,res)
    } catch (error) {
      console.log(error.message)
      res.redirect('/admin/admin-error')
    }
  }
  
  const updateCategory = async(req,res)=>{
    try {
      await categoryHelpers.updatingCategory(req,res);
    } catch (error) {
      console.log(error.message)
      res.redirect('/admin/admin-error')
    }
  }



  //newly add for category

//  const editCategory=  async(req,res)=>{
//     try {
//         const id = req.query._id;
//         console.log('ID:', id);


//         const categoryData = await Category.findById({ _id: id }).lean();
//         console.log('Category Data:', categoryData);

//         if (categoryData) {
//             res.render('admin/edit-category', { category: categoryData });
//         } else {
//             console.log('User not found');
//             res.redirect('/admin/category');
//         }
//     } catch (error) {
//         throw new Error(error.message);
//     }
// }

// const updatingCategory= async (req, res) => {
//     try {
//         const { id, category } = req.body;

//         // Check if a category with the same name (case-insensitive) already exists
//         const existingCategory = await Category.findOne({
//             _id: { $ne: id }, // Exclude the current category from the check
//             category: { $regex: new RegExp('^' + category + '$', 'i') }
//         });

//         if (existingCategory) {
//             const errorMessage = 'Category already exists.';
//             const updatedCategories = await Category.find().lean();
//             const categoryWithSerialNumber = updatedCategories.map((category, index) => ({
//                 ...category,
//                 serialNumber: index + 1,
//             }));

//             if (existingCategory) {
//               const errorMessage = 'Category already exists.';
//               const updatedCategories = await Category.find().lean();
//               const categoryWithSerialNumber = updatedCategories.map((category, index) => ({
//                   ...category,
//                   serialNumber: index + 1,
//               }));
  
//               return res.render('admin/category', {
                 
//                   category: categoryWithSerialNumber,
//                   error: errorMessage
//               });
//           }
//         }
//           // Update the category with the new name
//           await Category.findByIdAndUpdate(id, { category: category.toUpperCase() });
//           res.redirect('/admin/category');
//          }catch(error) {
//             console.error(error); // Log the error for debugging purposes
//             return res.status(500).send('Internal Server Error');
//         }
        
//       }
 





  //add user
  const addUser = async (req, res) => {
    const userData = await User.find({ is_admin: 0 }).lean();
    // console.log(userData);
    const usersWithSerialNumber = userData.map((users, index) => ({
      ...users,
      serialNumber: index + 1,
    }));
    res.render("admin/user", {
      user: usersWithSerialNumber,
    });
  };




  




const blockedUserlist = async (req, res) => {
  try {
    const userData = await User.find({ blocked: true }).lean();
    const usersWithSerialNumber = userData.map((blockUser, index) => ({
      ...blockUser,
      serialNumber: index + 1,
    }));
    res.render("admin/blockeduserlist", {
     
      user: usersWithSerialNumber,
    });
  } catch (error) {
    console.log(error.message);
  }
};




const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    // console.log(id, "id");
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: false } }
    );
    res.redirect("/admin/unblockUser");
  } catch (error) {
    console.log(error.message);
  }
};


const blockedUsers= async (req, res) => {
  try {
      const blockedUserData = await User.find({ is_admin: false, blocked: true }).lean();
      const usersWithSerialNumber = blockedUserData.map((user, index) => ({
          ...user,
          serialNumber: index + 1
      }));
      console.log(usersWithSerialNumber);
      res.render('admin/blocked-users', { users: usersWithSerialNumber });
  } catch (error) {
      throw new Error(error.message);
  }
}

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: true } }
    );
    console.log(userData);
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error.message);
  }
};




const getUserOrders = async (req, res) => {
  try {
    console.log('entered into getUSERORDERS'); 
    const orderData = await Order.find().populate("userId").lean();
    console.log(orderData, "order data coming");
    const orderHistory = orderData.map((history) => {
      let createdOnIST = moment(history.date)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY h:mm A");

      return { ...history, date: createdOnIST, username: history.userId.name };
    });
    console.log(orderHistory, "order serial numbers");
    res.render("admin/userOrders", {
      
      orderData: orderHistory,
    });
  } catch (error) {
    console.log(error.message);
  }
};


const loadOrdersView=async(req,res)=>{
  try {
    console.log("Enterd into the Orederview page........");
      const orderId = req.query.id;
     

      console.log(orderId, 'orderId');
      const order = await Order.findOne({ _id: orderId })
          .populate({
              path: 'products.productId',
              select: 'productname price images',
          })


      const createdOnIST = moment(order.date).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
      order.date = createdOnIST;

      const orderDetails = order.products.map(product => {
          const images = product.productId.images || []; // Set images to an empty array if it is undefined
          const image = images.length > 0 ? images[0] : ''; // Take the first image from the array if it exists
    
          return {
              name: product.productId.name,
              image: images,
              price: product.productId.price,
              total: product.total,
              quantity: product.quantity,
              status:order.orderStatus
          };
      });


      const deliveryAddress = {
          name: order.addressDetails.name,
         address: order.addressDetails.address,
          city: order.addressDetails.city,
          state: order.addressDetails.state,
          pincode: order.addressDetails.pincode,

      };



      const subtotal = order.orderValue;
      const cancellationStatus = order.cancellationStatus


      console.log(cancellationStatus,'cancellationStatus');
      console.log(subtotal, 'subtotal');
      console.log(orderDetails, 'orderDetails');
      console.log(deliveryAddress, 'deliveryAddress');

      res.render('admin/userOrderView', {
          orderDetails: orderDetails,
          deliveryAddress: deliveryAddress,
          subtotal: subtotal, 
          orderId: orderId,
          orderDate: createdOnIST,
           cancellationStatus:cancellationStatus,
      });
  } catch (error) {
      throw new Error(error.message);
  }
}


const cancelledByAdmin = async (req, res) => {
  try {
    const id = req.body.orderId;
    console.log(id, 'id');

    const url = '/admin/ordersView?id=' + id;
    console.log(url, 'url');

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { cancellationStatus: "cancellation requested", orderStatus: "cancelled" } },
      { new: true }
    ).exec();
    
    console.log(updateOrder, 'updateOrder');

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};




const rejectCancellation = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    console.log(orderId, 'orderID..............');

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Placed", cancellationStatus: "Not requested" } },
      { new: true }
    ).exec();

    console.log(updateOrder, 'OrderUpdated.............');

    const url = '/admin/ordersView?id=' + orderId;
    console.log(url, 'url......................');
    
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};






//form other side 


const productDelevery = async (req, res) => {
  try {
    console.log("entered into product delivery stage.................");
    const orderId = req.body.orderId;
    console.log(orderId, 'id here............');

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Shipped", cancellationStatus: "Shipped" } },
      { new: true }
    ).exec();

    console.log(updateOrder, 'updateOrder');

    const url = '/admin/ordersView?id=' + orderId;
    console.log(url, 'Here is the url..................');
    
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};


const deliveredProduct = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    console.log(orderId, 'id here...........');

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Delivered", cancellationStatus: "Delivered" } },
      { new: true }
    ).exec();

    console.log(updateOrder, 'updateOrder here..........');

    const url = '/admin/ordersView?id=' + orderId;
    console.log(url, 'url goes here...........');
    
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
  }
};











module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    adminLogout,
    deleteimg,

    loadProducts,
    insertProducts,
    loadCategory,
    addCategory,
    editCategoryLoad,
    updateCategory,
    loadProducts,
    
     addUser,
    
     blockUser,
     blockedUserlist,
     unblockUser,
     blockedUsers,

     editProduct,
     updateProduct,
     unlistProducts,
     listProducts,

     getUserOrders,
     loadOrdersView,
     cancelledByAdmin,
     rejectCancellation,
     productDelevery,
     deliveredProduct,
   
    

}