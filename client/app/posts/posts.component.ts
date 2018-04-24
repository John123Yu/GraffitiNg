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
  private drawing_data;
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
      lines: [
        {
          color: "#1b9e77",
          points: [[451, 448], [447, 447], [442, 445], [430, 440], [417, 433], [411, 429], [405, 424], [398, 420], [385, 410], [372, 398], [366, 392], [360, 385], [354, 378], [348, 370], [343, 362], [338, 354], [333, 346], [329, 337], [326, 328], [322, 318], [319, 309], [316, 299], [314, 289], [313, 279], [312, 269], [312, 259], [314, 239], [316, 228], [317, 218], [319, 209], [322, 199], [326, 190], [330, 181], [334, 172], [339, 164], [344, 156], [350, 149], [355, 143], [362, 136], [368, 131], [375, 125], [383, 120], [390, 115], [398, 111], [406, 107], [423, 99], [431, 96], [440, 93], [449, 90], [458, 87], [467, 86], [495, 83], [505, 83], [514, 83], [524, 84], [534, 85], [543, 87], [552, 89], [566, 95], [578, 101], [589, 106], [598, 112], [607, 118], [615, 125], [622, 131], [629, 138], [635, 146], [641, 153], [652, 169], [661, 185], [665, 194], [671, 210], [674, 218], [676, 226], [677, 234], [678, 241], [679, 249], [678, 264], [677, 271], [676, 279], [674, 286], [671, 293], [664, 307], [660, 313], [655, 320], [650, 326], [638, 338], [631, 344], [624, 349], [609, 359], [593, 367], [585, 370], [567, 375], [558, 378], [548, 379], [529, 382], [511, 383], [493, 382], [484, 381], [475, 379], [450, 371], [443, 367], [435, 363], [428, 358], [422, 353], [416, 347], [406, 335], [398, 321], [395, 314], [393, 307], [389, 292], [388, 277], [389, 261], [393, 239], [398, 226], [408, 207], [412, 202], [417, 197], [422, 192], [427, 188], [438, 181], [449, 176], [462, 172], [475, 169], [494, 168], [508, 168], [521, 170], [539, 176], [551, 182], [556, 185], [561, 188], [570, 196], [576, 205], [583, 220], [585, 224], [586, 231], [587, 243], [587, 255], [586, 260], [583, 270], [581, 275], [578, 279], [573, 285], [567, 290], [557, 297], [546, 302], [530, 307], [519, 309], [507, 309], [491, 307], [480, 304], [471, 299], [467, 296], [463, 294], [456, 287], [449, 276], [448, 272], [447, 268], [446, 260], [447, 252], [452, 240], [456, 232], [462, 226], [469, 220], [476, 217], [485, 214], [498, 211], [506, 211], [514, 213], [525, 218], [531, 222], [534, 225], [536, 227], [540, 233], [543, 239], [544, 245], [544, 253], [542, 257], [537, 263], [535, 265], [529, 269], [524, 271], [521, 271], [519, 271], [517, 272], [511, 271], [507, 270], [502, 267], [501, 265], [497, 261], [496, 259], [494, 257], [491, 245], [492, 242], [493, 239], [497, 237]]
        }
      ]
    };
  private render_line = d3Shape.line().curve(d3.curveLinear).x( function(d) {
    return d[0];
  }).y( function(d) {
    return d[1];
  })
  //.curve(d3.curveLinear)

  private redraw = (specific_line) => {
    var lines;
    lines = this.lines_layer.selectAll('.line').data(this.drawing_data.lines);
    lines.enter().append('path').attr("class", 'line')
    .attr("stroke", (d) =>  d.color)
    .each( function(d) {
      console.log(d3.select(this)['_groups'][0][0])
      return d.elem = d3.select(this)['_groups'][0][0];
    });
    if (this.specific_line != null) {
      this.specific_line.elem.attr({
        d: (d) => {
          return this.render_line(d.points);
        }
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
    this.redraw();
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
        return this.redraw();
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
        console.log(d3.select(this)['_groups']);
        return d3.select(this).classed('active', true);
      })

    this.swatches.each( (d) => {
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
    this.redraw();
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