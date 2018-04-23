import * as mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  message: String
});

const Post = mongoose.model('Post', postSchema);

export default Post;