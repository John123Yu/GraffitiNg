import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { PostService } from '../services/post.service';
import { ToastComponent } from '../shared/toast/toast.component';
import { Post } from '../shared/models/post.model';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent implements OnInit {

  post = new Post();
  posts: Post[] = [];
  isLoading = true;
  isEditing = false;

  addPostForm: FormGroup;
  name = new FormControl('', Validators.required);
  age = new FormControl('', Validators.required);
  weight = new FormControl('', Validators.required);

  constructor(private postService: PostService,
              private formBuilder: FormBuilder,
              public toast: ToastComponent) { }

  ngOnInit() {
    this.getPosts();
    this.addPostForm = this.formBuilder.group({
      name: this.name,
      age: this.age,
      weight: this.weight
    });
  }

  getPosts() {
    this.postService.getPosts().subscribe(
      data => this.posts = data,
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  addPost() {
    this.postService.addPost(this.addPostForm.value).subscribe(
      res => {
        this.posts.push(res);
        this.addPostForm.reset();
        this.toast.setMessage('item added successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  enableEditing(post: Post) {
    this.isEditing = true;
    this.post = post;
  }

  cancelEditing() {
    this.isEditing = false;
    this.post = new Post();
    this.toast.setMessage('item editing cancelled.', 'warning');
    // reload the posts to reset the editing
    this.getPosts();
  }

  editPost(post: Post) {
    this.postService.editPost(post).subscribe(
      () => {
        this.isEditing = false;
        this.post = post;
        this.toast.setMessage('item edited successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  deletePost(post: Post) {
    if (window.confirm('Are you sure you want to permanently delete this item?')) {
      this.postService.deletePost(post).subscribe(
        () => {
          const pos = this.posts.map(elem => elem._id).indexOf(post._id);
          this.posts.splice(pos, 1);
          this.toast.setMessage('item deleted successfully.', 'success');
        },
        error => console.log(error)
      );
    }
  }

}