const Listing=require("./models/listing");
const Review=require("./models/review");
const { listingSchema, reviewSchema}=require("./schema.js");
const ExpressError=require("./utils/ExpressError.js");
module.exports.isLoggedIn=(req,res,next)=>{
    if (!req.isAuthenticated()){
      req.session.redirectUrl = req.originalUrl;
        req.flash("error","you must be logged in to create listing!");
        return res.redirect("/login");
      }
      next();
};

module.exports.saveRedirectUrl=(req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  try {
      const { id } = req.params;
      const listing = await Listing.findById(id);
      
      if (!listing) {
          req.flash("error", "Listing not found.");
          return res.redirect("/listings");
      }

      // Check if the current user is the owner of the listing
      if (!listing.owner.equals(req.user._id)) {
          req.flash("error", "You do not have permission to do that.");
          return res.redirect(`/listings/${id}`);
      }

      next(); // Pass control to the next middleware or route handler
  } catch (error) {
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/listings");
  }
};

module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
      const errMsg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(400, errMsg);
  } else {
      next();
  }
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
      let errMsg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(400, errMsg);
  } else {
      next();
  }
};

module.exports.isreviewAuthor = async (req, res, next) => {
      const {id, reviewId } = req.params;
      const review = await Review.findById(reviewId);
      if (!review.author.equals(req.user._id)) {
          req.flash("error", "You did not create this Review.");
          return res.redirect(`/listings/${id}`);
      }

      next(); 
  
};