
const pdfDoc = new PDFDocument();
const filePath = path.join(__dirname, `downloads_${orderId}.pdf`); // Use 'path.join()' to create the file path

pdfDoc.pipe(fs.createWriteStream(filePath));
pdfDoc.fontSize(16).text(`Order ID: ${orderId}`, { align: 'center' });

order.products.forEach((product, index) => {
  const images = product.productId.images || [];
  const image = images.length > 0 ? images[0] : '';

  // Check if the image path is not empty before adding the image to the PDF
  if (image) {
    // Use 'path.join()' to create the full path to the image file
    const imagePath = path.join(__dirname, 'path/to/your/images/', image);

    // Add the image to the PDF with specified position, width, and height
    pdfDoc.image(imagePath, {
      fit: [100, 100], // Set the width and height of the image in points (100x100 in this example)
      align: 'center', // Align the image to the center of the page
      valign: 'center', // Vertically center the image on the page
    });
  }

  pdfDoc.text(`Product Purchased ${index + 1}: ${product.productId.productname}`);
  pdfDoc.text(`Price: ${product.productId.price}`);
  pdfDoc.text(`Discount: ${product.discount}`)
  pdfDoc.text(`Quantity: ${product.quantity}`);

  pdfDoc.text('------------------------------');
});

pdfDoc.end();








//new invoice 

const loadOrdersView = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userId = req.session.user_id;

    console.log(orderId, 'orderId when loading page');
    const order = await Order.findOne({ _id: orderId }).populate({
      path: 'products.productId',
      select: 'productname price images',
    });

    const createdOnIST = moment(order.date).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
    order.date = createdOnIST;

    const orderDetails = order.products.map((product) => {
      const images = product.productId.images || [];
      const image = images.length > 0 ? images[0] : '';

      return {
        name: product.productId.productname,
        image: images,
        price: product.productId.price,
        total: product.total,
        quantity: product.quantity,
        status: order.orderStatus,
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
    const cancellationStatus = order.cancellationStatus;

    console.log(subtotal, 'subtotal');
    console.log(orderDetails, 'orderDetails');
    console.log(deliveryAddress, 'deliveryAddress');

    res.render('users/ordersView', {
      orderDetails: orderDetails,
      deliveryAddress: deliveryAddress,
      subtotal: subtotal,
      orderId: orderId,
      orderDate: createdOnIST,
      cancellationStatus: cancellationStatus,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId }).populate({
      path: 'products.productId',
      select: 'productname price images',
    });

    const createdOnIST = moment(order.date).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
    order.date = createdOnIST;

    const orderDetails = order.products.map((product) => {
      const images = product.productId.images || [];
      const image = images.length > 0 ? images[0] : '';

      return {
        name: product.productId.productname,
        image: images,
        price: product.productId.price,
        total: product.total,
        quantity: product.quantity,
        status: order.orderStatus,
      };
    });

    const deliveryAddress = {
      name: order.addressDetails.name,
      address: order.addressDetails.address,
      city: order.addressDetails.city,
      state: order.addressDetails.state,
      pincode: order.addressDetails.pincode,
    };

    const pdfDoc = new PDFDocument();
    const filePath = path.join(__dirname, `downloads_${orderId}.pdf`);

    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.fontSize(16).text(`Order ID: ${orderId}`, { align: 'center' });

    orderDetails.forEach((product, index) => {
      // Your code to add product details to the PDF here...
    });

    // Add delivery address details to the PDF
    pdfDoc.text('Delivery Address:');
    pdfDoc.text(`Name: ${deliveryAddress.name}`);
    pdfDoc.text(`Address: ${deliveryAddress.address}`);
    pdfDoc.text(`City: ${deliveryAddress.city}`);
    pdfDoc.text(`State: ${deliveryAddress.state}`);
    pdfDoc.text(`Pincode: ${deliveryAddress.pincode}`);

    pdfDoc.end();

    res.download(filePath); // Automatically downloads the generated PDF
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};
