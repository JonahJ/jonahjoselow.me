// DentModifier allows us to make local spherical deformation
// options
// origin - point where the applied strain
// direction - deformation direction ( usually the opposite of normal )
// radius - deformation radius
// depth - deformation depth

THREE.DentModifier = function() {};
THREE.DentModifier.prototype = {
    constructor: THREE.DentModifier,
    set: function(origin, direction, radius, depth) {
        this.origin = origin;
        this.direction = direction;
        this.radius = radius;
        this.depth = depth;
        return this
    },
    modify: function(mesh) {
        this.mesh = mesh;
        var M = new THREE.Matrix4().getInverse(mesh.matrixWorld);
        var origin = this.origin.applyMatrix4(M);

        var normal = new THREE.Vector3();
        normal.copy(this.direction);
        normal.multiplyScalar(-this.radius * (1 - this.depth));

        var centerSphere = new THREE.Vector3();
        centerSphere.addVectors(origin, normal);
        var Sphere = new THREE.Sphere(centerSphere, this.radius);

        for (var i = 0; i < mesh.geometry.vertices.length; i++) {
            if (centerSphere.distanceTo(mesh.geometry.vertices[i]) < this.radius) {
                var Ray = new THREE.Ray(mesh.geometry.vertices[i], this.direction);
                var punct = Ray.intersectSphere(Sphere);
                mesh.geometry.vertices[i] = punct;
            }
        }
        return this
    },
    update: function() {
        this.mesh.geometry.computeFaceNormals();
        this.mesh.geometry.computeVertexNormals();
        this.mesh.geometry.verticesNeedUpdate = true;
        this.mesh.geometry.normalsNeedUpdate = true;
    }
}
