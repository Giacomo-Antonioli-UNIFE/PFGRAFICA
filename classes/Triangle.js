/**
 * Classe che rappresenta un generico triangolo.
 */
class Triangle extends Figure {
    /**
     * @constructor
     * @param {Array} p1 Primo vertice
     * @param {Array} p2 Secondo vertice
     * @param {Array} p3 Terzo vertice
     * @param {Integer} material Indice della lista di materiali di cui è costituito l'oggetto
     */
    constructor(p1, p2, p3, material, index) {
        super(material, index);
        this._p1 = glMatrix.vec3.fromValues(p1[0], p1[1], p1[2]);
        this._p2 = glMatrix.vec3.fromValues(p2[0], p2[1], p2[2]);
        this._p3 = glMatrix.vec3.fromValues(p3[0], p3[1], p3[2]);
       
    }

    //____________________________________________________________________________________________________

    /*

##     ## ######## ######## ##     ##  #######  ########   ######
###   ### ##          ##    ##     ## ##     ## ##     ## ##    ##
#### #### ##          ##    ##     ## ##     ## ##     ## ##
## ### ## ######      ##    ######### ##     ## ##     ##  ######
##     ## ##          ##    ##     ## ##     ## ##     ##       ##
##     ## ##          ##    ##     ## ##     ## ##     ## ##    ##
##     ## ########    ##    ##     ##  #######  ########   ######

*/

    /**
     * Funzione che calcola il punto di intersezione tra un raggio e l'oggetto.
     * @param {Ray} ray Raggio
     * @returns {Boolean} Hit Dice se il raggio interseca l'oggetto.
     */
    intersection(ray) {
        let solutions;

        let A = [
            [this._p1[0] - this._p2[0], this._p1[0] - this._p3[0], ray.direction[0], this._p1[0] - ray.origin[0]],
            [this._p1[1] - this._p2[1], this._p1[1] - this._p3[1], ray.direction[1], this._p1[1] - ray.origin[1]],
            [this._p1[2] - this._p2[2], this._p1[2] - this._p3[2], ray.direction[2], this._p1[2] - ray.origin[2]],
        ];

        solutions = triangleSolutions(A); //Calcola il vettore contenente la soluzione delle tre equazioni necessarie
        //per identificare intersezione triangolo-raggio


        //if (beta>0 && gamma>0 &&(beta+gamma)<1 ) --> HIT!
        if (solutions[0] > -EPSILON && solutions[1] > -EPSILON && (solutions[0] + solutions[1]) < 1 && solutions[2] > ray.tMin) {
            let point = glMatrix.vec3.create();
            glMatrix.vec3.scaleAndAdd(point, ray.origin, ray.direction, solutions[2]); // calcolo punto di intersezione

            let lato1 = glMatrix.vec3.create(); // vettore appoggio lato1 triangolo
            let lato2 = glMatrix.vec3.create(); // vettore appoggio lato2 triangolo
            glMatrix.vec3.subtract(lato1, this._p2, this._p1); // calcolo lato1 triangolo
            glMatrix.vec3.subtract(lato2, this._p3, this._p2); // calcolo lato2 triangolo
            let normal = glMatrix.vec3.create();
            glMatrix.vec3.cross(normal, lato1, lato2); //prodotto vettoriale dei due lati, normale per definizione

            if ((glMatrix.vec3.distance(point, ray.origin) - ray.tMax) < shadow_bias) {
                this.setInterception(solutions[2], point, normal, ray.direction);
                return true;
            } else
                return false;

        } else
            return false;
    }


    /** */
    setTranslation(TransaltionVector) {
        super.setTranslation(TransaltionVector);
    }

    /** */
    setRotation(RotationVector) {
        super.setRotation(RotationVector);
    }

    /** */
    setScaling(ScalingVector) {
        super.setScaling(ScalingVector);
    }

    /** */
    invertMatrix() {
        super.invertMatrix();
    }

    /** */
    transposeInvertedMatrix() {
        super.transposeInvertedMatrix();
    }

    /** */
    setTransformationMatrixValue() {
        super.setTransformationMatrixValue();
    }

    /** */
    initInterception() {
        super.initInterception();
    }

    /** */
    setInterception(t, interception_point, normal, direction) {
        super.setInterception(t, interception_point, normal, direction);
    }

    /**
     * Funzione che mostra il tipo di oggetto corrente (Sfera).
     */
    me() {
        console.log("TRIANGLE");
    }

    /** */
    showTransformationMatrix() {
        super.showTransformationMatrix();
    }

    /** */
    isTheSame(secondObject) {
        return super.isTheSame(secondObject);
    }

    /** */
    RestoreSDR() {
        super.RestoreSDR();
    }

    setPoints(p1,p2,p3){
        this._p1 = glMatrix.vec3.fromValues(p1[0], p1[1], p1[2]);
        this._p2 = glMatrix.vec3.fromValues(p2[0], p2[1], p2[2]);
        this._p3 = glMatrix.vec3.fromValues(p3[0], p3[1], p3[2]);
    }

    //____________________________________________________________________________________________________
    /*
        ######  ######## ######## ######## ######## ########   ######  
        ##    ## ##          ##       ##    ##       ##     ## ##    ## 
        ##       ##          ##       ##    ##       ##     ## ##       
         ######  ######      ##       ##    ######   ########   ######  
              ## ##          ##       ##    ##       ##   ##         ## 
        ##    ## ##          ##       ##    ##       ##    ##  ##    ## 
         ######  ########    ##       ##    ######## ##     ##  ######  
    */

    /** */
    set t(value) {
        super.t = value;
    }

    /** */
    set interception_point(value) {
        super.interception_point = value;
    }

    /** */
    set normal(value) {
        super.normal = value;
    }



    /** */
    set material(value) {
        super.material = value;
    }

    /** */
    set index(value) {
        super.index = value;
    }

    /** */
    set TransformationMatrix(value) {
        super.TransformationMatrix = value;
    }

    /** */
    set inverseTransformationMatrix(value) {
        super.inverseTransformationMatrix = value;
    }

    /** */
    set transposedInverseTransformationMatrix(value) {
        super.transposedInverseTransformationMatrix = value;
    }

    /** */
    set hasTransformationMatrix(value) {
        super.hasTransformationMatrix = value;
    }

    //____________________________________________________________________________________________________
    /*

    ######   ######## ######## ######## ######## ########   ######
    ##    ##  ##          ##       ##    ##       ##     ## ##    ##
    ##        ##          ##       ##    ##       ##     ## ##
    ##   #### ######      ##       ##    ######   ########   ######
    ##    ##  ##          ##       ##    ##       ##   ##         ##
    ##    ##  ##          ##       ##    ##       ##    ##  ##    ##
     ######   ########    ##       ##    ######## ##     ##  ######

*/

    get interception_point() {
        return super.interception_point;
    }

    get normal() {
        return super.normal;
    }

    get p1() {
        return this._p1;
    }

    get p2() {
        return this._p2;
    }

    get p3() {
        return this._p3;
    }

    get material() {
        return super.material;
    }

    get index() {
        return super.index;
    }

    get TransformationMatrix() {
        return super.TransformationMatrix;
    }

    get inverseTransformationMatrix() {
        return super.inverseTransformationMatrix;
    }

    get transposedInverseTransformationMatrix() {
        return super.transposedInverseTransformationMatrix;
    }

    get hasTransformationMatrix() {
        return super.hasTransformationMatrix;
    }

    get t() {
        return super.t;
    }



}

//____________________________________________________________________________________________________
/*
    ######## ##     ## ##    ##  ######  ######## ####  #######  ##    ##  ######  
    ##       ##     ## ###   ## ##    ##    ##     ##  ##     ## ###   ## ##    ## 
    ##       ##     ## ####  ## ##          ##     ##  ##     ## ####  ## ##       
    ######   ##     ## ## ## ## ##          ##     ##  ##     ## ## ## ##  ######  
    ##       ##     ## ##  #### ##          ##     ##  ##     ## ##  ####       ## 
    ##       ##     ## ##   ### ##    ##    ##     ##  ##     ## ##   ### ##    ## 
    ##        #######  ##    ##  ######     ##    ####  #######  ##    ##  ###### 
*/

/**
 * applicazione metodo di cramer per la risoluzione di sistemi lineari
 * @param {Array} A Matrice associata al sistema
 * @return {Array} array delle soluzioni
 */
function triangleSolutions(A) {
    let M = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) + A[1][0] * (A[0][2] * A[2][1] - A[0][1] * A[2][2]) + A[2][0] * (A[0][1] * A[1][2] - A[1][1] * A[0][2]);
    let solutions = [];
    solutions.push((A[0][3] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) + A[1][3] * (A[0][2] * A[2][1] - A[0][1] * A[2][2]) + A[2][3] * (A[0][1] * A[1][2] - A[1][1] * A[0][2])) / M);
    solutions.push((A[2][2] * (A[0][0] * A[1][3] - A[0][3] * A[1][0]) + A[1][2] * (A[0][3] * A[2][0] - A[0][0] * A[2][3]) + A[0][2] * (A[1][0] * A[2][3] - A[1][3] * A[2][0])) / M);
    solutions.push(-(A[2][1] * (A[0][0] * A[1][3] - A[0][3] * A[1][0]) + A[1][1] * (A[0][3] * A[2][0] - A[0][0] * A[2][3]) + A[0][1] * (A[1][0] * A[2][3] - A[1][3] * A[2][0])) / M);
    return solutions;

}