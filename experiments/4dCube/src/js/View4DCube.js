// View4DCube.js

import alfrid, { GL, GLShader, EaseNumber } from 'alfrid';
import vsCube from 'shaders/cube.vert';
import fsCube from 'shaders/cube.frag';

import vsPlane from 'shaders/plane.vert';
import fsPlane from 'shaders/plane.frag';

import getRandomAxis from './utils/getRandomAxis';
import Scheduler from 'scheduling';

var random = function(min, max) { return min + Math.random() * (max - min);	}


class View4DCube extends alfrid.View {
	
	constructor() {
		super(vsCube, fsCube);
		this._shaderPlane = new GLShader(vsPlane, fsPlane);

		this._isDirty = true;

		this.dimension = vec3.fromValues(1, 1, 1);
		this._rotation = 0;
		this._rotationAxis = getRandomAxis();
		this._position = vec3.create();

		this.dimensionMask = vec3.create(2, 2, 2);
		this._rotationMask = 0;
		this._rotationAxisMask = getRandomAxis();
		this._positionMask = vec3.create();

		this._modelMatrix = mat4.create();
		this._mtxRotation = mat4.create();
		this._mtxRotationMask = mat4.create();

		this._boundUpDist = new EaseNumber(.5);
		this._boundBottomDist = new EaseNumber(.5);


		const r = 0.05;
		this._boundUp = vec4.fromValues(random(-r, r), 1, random(-r, r), this._boundUpDist.value);
		this._boundBottom = vec4.fromValues(random(-r, r), -1, random(-r, r), this._boundBottomDist.value);
		this._boundRight = vec4.fromValues(1, 0, 0., .5);
		this._boundLeft = vec4.fromValues(-1, 0, 0., .5);
		this._boundFront = vec4.fromValues(0, 0, 1, .5);
		this._boundBack = vec4.fromValues(0, 0, -1, .5);

		this._bounds = [
			this._boundUp,
			this._boundBottom
			// this._boundRight,
			// this._boundLeft,
			// this._boundFront,
			// this._boundBack
		]
	}


	_init() {
		this.mesh = alfrid.Geom.cube(1, 1, 1);
		this.plane = alfrid.Geom.plane(3, 3, 1);
	}


	render() {
		this.update();

		this._boundUp[3] = this._boundUpDist.value;
		this._boundBottom[3] = this._boundBottomDist.value;

		const bounds = this._bounds.map( bound => {
			const boundTransformed = vec4.create();
			vec4.transformMat4(boundTransformed, bound, this._mtxRotationMask);

			return boundTransformed;
		});
		

		this.shader.bind();
		this.shader.uniform("uPositionMask", "vec3", this._positionMask);
		this.shader.uniform(params.light);
		bounds.forEach( (bound, i) => {
			this.shader.uniform(`uPlane${i}`, "vec4", bound);
		});
		GL.rotate(this._modelMatrix);
		GL.draw(this.mesh);



		GL.gl.cullFace(GL.gl.FRONT);

		//	draw cull plane
		this._shaderPlane.bind();
		this._shaderPlane.uniform(params.light);
		this._shaderPlane.uniform("uDimension", "vec3", this.dimension);
		this._shaderPlane.uniform("uPositionMask", "vec3", this._positionMask);

		const boundTransformed = vec4.create();
		bounds.forEach( bound => {
			this._shaderPlane.uniform("uPlane", "vec4", bound);
			GL.draw(this.plane);
		});

		GL.gl.cullFace(GL.gl.BACK);
	}


	update() {
		if(this._isDirty) {
			this._updateRotationMatrices();
			this._isDirty = false;
		}

		mat4.fromTranslation(this._modelMatrix, this._position);
		mat4.multiply(this._modelMatrix, this._modelMatrix, this._mtxRotation);
	}


	_updateRotationMatrices() {
		let q = quat.create();

		quat.setAxisAngle(q, this._rotationAxis, this._rotation);
		mat4.fromQuat(this._mtxRotation, q);

		quat.setAxisAngle(q, this._rotationAxisMask, this._rotationMask);
		mat4.fromQuat(this._mtxRotationMask, q);
	}


	get boundUpDist() {
		return this._boundUpDist.value;
	}

	set boundUpDist(mValue) {
		this._boundUpDist.value = mValue;
	}

	get boundBottomDist() {
		return this._boundBottomDist.value;
	}

	set boundBottomDist(mValue) {
		this._boundBottomDist.value = mValue;
	}


	get rotation() {
		return this._rotation;
	}

	set rotation(mValue) {
		this._rotation = mValue;
		this._isDirty = true;
	}


	get rotationMask() {
		return this._rotationMask;
	}

	set rotationMask(mValue) {
		this._rotationMask = mValue;
		this._isDirty = true;
	}
}

export default View4DCube;