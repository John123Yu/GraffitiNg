import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { PostService } from '../services/post.service';
import { ToastComponent } from '../shared/toast/toast.component';
import { Post } from '../shared/models/post.model';

import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';

interface Data {
   x: number;
   y: number;
}

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent implements OnInit {
  
  title: string = 'D3.js with Angular 2!';
  subtitle: string = 'Line Chart';
  private margin = {top: 20, right: 20, bottom: 30, left: 50};
  private width: number;
  private height: number;
  private line: d3Shape.Line<[number, number]>;
  private SWATCH_D = 22;
  private active_color;
  private active_line;
  private canvas;
  private drag;
  private lines_layer;
  private palette;
  private swatches;
  private trash_btn;
  private ui;
  private post_counter = 0;
  private post = new Post();
  private posts: Post[] = [];
  private isLoading = true;
  private isEditing = false;

  private drawing_data = {
      lines: []
    };
  private render_line = d3Shape.line().x( function(d) {
    return d[0];
  }).y( function(d) {
    return d[1];
  }).curve(d3.curveMonotoneX);
  //.curve(d3.curveLinear)

  private redraw = (specific_line) => {
    var lines;
    lines = this.lines_layer.selectAll('.line').data(this.drawing_data.lines);
    lines.enter().append('path').attr("class", 'line')
    //.attr("stroke", (d) =>  d.color)
    .each( function(d) {
      //console.log(d3.select(this)['_groups'][0][0])
      //console.log(d3.select(this));
      return d.elem = d3.select(this);
    })
    .attr("d", this.render_line);
    if (specific_line != null) {
      console.log(specific_line)
      //console.log(specific_line.elem['_groups'][0][0])
      specific_line.elem.attr("d", (d) => {
        return this.render_line(d.points);
      });
    } else {
      lines.attr("d", (d) => {
        return this.render_line(d.points);
      });
    }
    return lines.exit().remove();
  };

  addPostForm: FormGroup;
  message = new FormControl('', Validators.required);

  constructor(private postService: PostService,
              private formBuilder: FormBuilder,
              public toast: ToastComponent) {}

  ngOnInit() {
    this.width = 900 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.active_line = null;
    this.active_color = "#333333";

    this.initSvg();
    this.redraw(null);
    this.getPosts();
    this.addPostForm = this.formBuilder.group({
      message: this.message
    });
  }

  private initSvg() {
    this.canvas = d3.select('#svg_div').append('svg').attr('width', this.width).attr('height', this.height);
    this.lines_layer = this.canvas.append('g');
    this.ui = d3.select('#svg_div').append('svg')
    //.attr('width', this.width).attr('height', this.height);

    this.palette = this.ui.append('g').attr("transform" , "translate(" + (4 + this.SWATCH_D / 2) + "," + (4 + this.SWATCH_D / 2) + ")");

    this.trash_btn = this.ui.append('text').html('&#xf1f8;')
      .attr( "class", 'btn')
      .attr("dy", '0.35em')
      .attr("transform", 'translate(940,20)')
      .on('click', () => {
        this.drawing_data.lines = [];
        return this.redraw(null);
      });

    this.swatches = this.palette.selectAll('swatch').data(["#333333", "#ffffff", "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]);

    this.swatches.enter().append('circle')
      .attr("class", 'swatch')
      .attr("cx", (d, i) =>  i * (this.SWATCH_D + 4) / 2 )
      .attr("cy", (d, i) =>  {
        if (i % 2) {
          return this.SWATCH_D;
        } else {
          return 0;
        }
      })
      .attr("r", this.SWATCH_D / 2)
      .attr("fill", (d) => d)
      .on('click', (d) => {
        this.active_color = d;
        //console.log(this)
        this.swatches.classed('active', false);
//        console.log(d3.select(this))
//        console.log(d3.select(this).classed)
//        return d3.select(this).classed('active', true);
      })
      .on('click', function() {
       // console.log(d3.select(this)['_groups']);
        return d3.select(this).classed('active', true);
      })

    this.swatches.each( function(d) {
      //console.log(this)
      if (d === this.active_color) {
        return d3.select(this).classed('active', true);
      }
    });
    this.drag = d3.drag();
    this.drag.on('start', () => {
      this.active_line = {
        points: [],
        color: this.active_color
      };
      this.drawing_data.lines.push(this.active_line);
      return this.redraw(this.active_line);
    });
    this.drag.on('drag', () => {
      //console.log(this.canvas['_groups'][0][0])
      //console.log(d3.mouse(this.canvas['_groups'][0][0]))
      this.active_line.points.push(d3.mouse(this.canvas['_groups'][0][0]));
      //console.log(this.active_line)
      return this.redraw(this.active_line);
    });
    this.drag.on('end', () => {
      if (this.active_line.points.length === 0) {
        this.drawing_data.lines.pop();
      }
      this.active_line = null;
      return console.log(this.drawing_data);
    });
    this.canvas.call(this.drag);
  }

  private drawLine() {
    this.redraw(null);
  }

  getPosts() {
    this.postService.getPosts().subscribe(
      data => {
        this.posts = data;
        this.post = this.posts[this.post_counter];
      },
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  nextPost() {
    if(this.post_counter === this.posts.length - 1 )
      this.post_counter = 0;
    else
      this.post_counter++;
    this.post = this.posts[this.post_counter];
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