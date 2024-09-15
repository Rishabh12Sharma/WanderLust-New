const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true,  // This ensures that the comment field is required
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true  // Make sure the rating field is also required
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});


module.exports=mongoose.model("Review",reviewSchema);