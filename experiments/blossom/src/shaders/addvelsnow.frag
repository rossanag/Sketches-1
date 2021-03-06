// addvel.frag

#define SHADER_NAME SIMPLE_TEXTURE

precision highp float;
varying vec2 vTextureCoord;
uniform sampler2D texturePos;
uniform sampler2D textureVel;

void main(void) {
	vec3 pos = texture2D(texturePos, vTextureCoord).rgb;
	vec3 vel = texture2D(textureVel, vTextureCoord).rgb;
	pos += vel;
	if(pos.x > 5.0) {
		pos.x -= 10.0;
	}
    gl_FragColor = vec4(pos, 1.0);
}