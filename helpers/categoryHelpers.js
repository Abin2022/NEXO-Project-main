const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const multer = require('multer')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const randomstring = require("randomstring");
var path = require('path');
const fs = require('fs')


module.exports={
    editingCategoryPageLoad: async(req,res)=>{
        try {
            const id = req.query.id;
           

            const categoryData = await Category.findById({ _id: id }).lean();
            

            if (categoryData) {
                res.render('admin/edit-category', { category: categoryData });
            } else {
                
                res.redirect('/admin/category');
            }
        } catch (error) {
          
            res.redirect('/admin/error')
        }
    },

    updatingCategory: async (req, res) => {
        try {
            const { id, category } = req.body;
    
            // Check if a category with the same name (case-insensitive) already exists
            const existingCategory = await Category.findOne({
                _id: { $ne: id },    // Exclude the current category from the check
                category: { $regex: new RegExp('^' + category + '$', 'i') }
            });
    
            if (existingCategory) {
                const errorMessage = 'Category already exists.';
                const updatedCategories = await Category.find().lean();
                const categoryWithSerialNumber = updatedCategories.map((category, index) => ({
                    ...category,
                    serialNumber: index + 1,
                }));
    
                return res.render('admin/category', {
                    
                    category: categoryWithSerialNumber,
                    error: errorMessage
                });
            }
    
            // Update the category with the new name
            await Category.findByIdAndUpdate(id, { category: category.toUpperCase() });
            res.redirect('/admin/category');
        } catch (error) {
            console.log(error.message)
            res.redirect('/admin/error')
        }
    },

   
    

}