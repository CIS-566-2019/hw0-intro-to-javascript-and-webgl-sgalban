#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform vec4 u_CamForward;
uniform int u_Time;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

void main() {
    // Material base color (before shading)
        float rNorm = sin(fs_Pos.x * 3.0 + float(u_Time) * 0.01) * 0.5 + 0.5;
        float gNorm = cos(fs_Pos.y * 2.0 + float(u_Time) * 0.02) * 0.5 + 0.5;
        float bNorm = sin(fs_Pos.z * 4.0 + float(u_Time) * 0.03) * cos(fs_Pos.z * 2.0 + float(u_Time) * 0.01) * 0.5 + 0.5;

        float rFres = cos(fs_Pos.x * 3.0 + float(u_Time) * 0.01) * 0.5 + 0.5;
        float gFres = sin(fs_Pos.y * 2.0 + float(u_Time) * 0.02) * 0.5 + 0.5;
        float bFres = cos(fs_Pos.z * 4.0 + float(u_Time) * 0.03) * 0.5 + 0.5;

        // I actually have no idea how this is supposed to be calculated, but this seems about right
        float fresnelFactor = pow(dot(u_CamForward, fs_Nor), 1.1); 

        vec4 normalColor = vec4(rNorm, gNorm, bNorm, 1);
        vec4 fringeColor = clamp(vec4(rFres, gFres, bFres, 1) * 6.0, vec4(0.0, 0.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0));
        vec4 diffuseColor = mix(fringeColor, normalColor, fresnelFactor);

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

        float ambientTerm = 0.15;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
