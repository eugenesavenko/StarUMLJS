/**
 * Created by csmith on 15-09-10.
 *
 * Generates code in a Mongoose schema pattern.
 * See templates/functional/functional.js as an example.
 */

define(function (require, exports, module) {

    "use strict";

    var CodeGenerator = require("CodeGenerators/CodeGenerator").CodeGenerator;

    function MongooseCodeGenerator(opts) {

        this.tabSize = opts.indentSpaces || 4;
        this.copyright = opts.copyright || "";

    }

    MongooseCodeGenerator.prototype = new CodeGenerator();

    MongooseCodeGenerator.prototype.getMethodDocumentation = function (op) {

        var s = "";

        s += "\n" + this.getTab() + "/**\n";

        if (op.documentation && op.documentation !== "") {

            s += this.getTab() + "* @documentation: " + op.documentation.replace("\n", "\n" + this.getTab() + "*" + this.getTab()) + "\n" + this.getTab() + "*" + this.getTab() + "\n";

        }

        if (op.specification && op.specification !== "") {

            s += this.getTab() + "* @specification: " + op.specification.replace("\n", "\n" + this.getTab() + "*" + this.getTab()) + "\n" + this.getTab() + "*\n";

        }

        for (var i = 0; i < op.preconditions.length; i++) {

            if (op.preconditions[i] instanceof type.UMLConstraint) {

                s += this.getTab() + "* @precondition " + op.preconditions[i].name + " : " + op.preconditions[i].specification.replace("\n", "\n*" + this.getTab()) + "\n";

            }

        }

        for (i = 0; i < op.postconditions.length; i++) {

            if (op.postconditions[i] instanceof type.UMLConstraint) {

                s += this.getTab() + "* @postcondition " + op.postconditions[i].name + " : " + op.postconditions[i].specification.replace("\n", "\n" + this.getTab() + "*" + this.getTab()) + "\n";

            }

        }

        for (var p = 0; p < op.parameters.length; p++) {

            switch (op.parameters[p].direction) {
                case "return":
                    s += this.getTab()+"* @return ";
                    break;

                case "in":
                    s += this.getTab()+"* @param ";
                    break;
            }

            s += op.parameters[p].name;

            if(op.parameters[p].type){

                s += " {" + op.parameters[p].type + "} ";

            }else{

                s += " { null } ";

            }

            s += op.parameters[p].documentation.replace("\n", "\n*" + this.getTab()) + "\n";

        }

        s += this.getTab() + "*/\n";

        return s;
    };

    MongooseCodeGenerator.prototype.getHeader = function (elem) {

        var now = new Date();
        var s = "";
        s += "//app/models/" + elem.name.toLowerCase();
        s += "\n" + this.copyright.replace(/\\n/g, "\n");
        s += "\n/**\n";
        s += "* Generated On: "+ now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+"\n";
        s += "* Class: " + elem.name+"\n";
        if(elem.documentation && elem.documentation !== ""){

            s += "* Description: "+elem.documentation.replace("\n", "\n* ")+"\n";

        }
        s += "*/\n\n";

        s += "var mongoose = require(\'mongoose\');" + "\n";
        s += "var Schema = mongoose.Schema;" + "\n";
        return s;

    };

    MongooseCodeGenerator.prototype.getDependancies = function (elem) {

        if (!elem || !elem.ownedElements || !elem.ownedElements.length) {

            return "";
        }

        var s = "";

        for (var i = 0; i < elem.ownedElements.length; i++) {

            if (elem.ownedElements[i] instanceof type.UMLGeneralization) {

                if (
                    elem.ownedElements[i].target instanceof type.UMLClass
                ) {

                    s += "var " + elem.ownedElements[i].target.name + " = require('" + elem.ownedElements[i].target.name + "');\n\n";

                }

            } else if (elem.ownedElements[i] instanceof type.UMLAssociation &&
                elem.ownedElements[i].end1 instanceof type.UMLAssociationEnd &&
                elem.ownedElements[i].end2 instanceof type.UMLAssociationEnd &&
                elem.ownedElements[i].end2.reference instanceof type.UMLClass &&
                elem.ownedElements[i].end1.name !== "" &&
                elem.ownedElements[i].end2.reference.name !== ""
            ) {

                //a (mostly) valid UML association we can use.

                s += "var " + elem.ownedElements[i].end1.name + " = require('" + elem.ownedElements[i].end2.reference.name + "');\n\n";

            } else if (
                elem.ownedElements[i] instanceof type.UMLDependency &&
                elem.ownedElements[i].target instanceof type.UMLClass &&
                elem.ownedElements[i].target.name
            ) {

                s += "var " + elem.ownedElements[i].target.name + " = require('" + elem.ownedElements[i].target.name + "');\n\n";

            }

        }

        return s;

    };

    MongooseCodeGenerator.prototype.getOperation = function (elem, op) {

        var s = "";

        s += this.getMethodDocumentation(op);

        //function name
        s += this.getTab() + "var " + op.name + " = function(";

        s += this.getOperationParams(op);

        //end function
        if (elem.isAbstract) {

            s += "){\n" + this.getTab() + this.getTab() + "throw 'AbstractMethodNotImplementedError';\n\n" + this.getTab() + "};\n\n";

        } else {

            s += "){\n" + this.getTab() + this.getTab() + "//TODO: Implement Me \n\n" + this.getTab() + "};\n\n";

        }

        return s;
    };

    MongooseCodeGenerator.prototype.getClassDefinition = function (elem) {

        var s = "";

        s += "var " + elem.name + "Schema = new Schema({\n";

        s += this.getAttributeDefinitions(elem);

        s += "\n\n";

        return s;
    };

    MongooseCodeGenerator.prototype.getAttributeDefinitions = function (elem) {

        var s = "";

        if (!elem || !elem.attributes || !elem.attributes.length) {

            return s;
        }

        var attributeClass = null;
        var lineStart = "\n";
        for (var i = 0; i < elem.attributes.length; i++) {
            var attribute = elem.attributes[i];
            attributeClass = attribute.type || "String";
            switch (attributeClass.toString()) {
            case "[object Object]":
                var leftSquareBracket = "";
                var rightSquareBracket = "";
                var multiplicity = attribute.multiplicity;
               if (multiplicity && (multiplicity === "*" || multiplicity === "0..*")) {
                    leftSquareBracket = "[";
                    rightSquareBracket = "]"
                }
            attributeClass = leftSquareBracket + "{type: Schema.Types.ObjectId, ref: '" + this.getFileName(attributeClass.name) + "'}" + rightSquareBracket;
            break;
            }
            s +=  lineStart + this.getTab() + attribute.name + ": " + attributeClass;
            lineStart = ",\n";
        }
        return s;

    };
    /**
    * Locate the association for the attribute using the name
    */
    MongooseCodeGenerator.prototype.getAssociation = function (elem, attribute) {
           for (var i = 0; i < elem.ownedElements.length; i++) {
                var association = elem.ownedElements[i];
                if (association instanceof type.UMLAssociation &&
                    association.end1 instanceof type.UMLAssociationEnd &&
                    association.end2 instanceof type.UMLAssociationEnd &&
                    association.end2.reference instanceof type.UMLClass &&
                    association.name === attribute.name
                ) {

                    return association;
                }
           }
           return null;
    }

    MongooseCodeGenerator.prototype.getInheritance = function (elem) {

        if (!elem || !elem.ownedElements || !elem.ownedElements.length) {

            return "";
        }

        var s = "";

        for (var i = 0; i < elem.ownedElements.length; i++) {

            if (elem.ownedElements[i] instanceof type.UMLGeneralization) {

                if (elem.ownedElements[i].target instanceof type.UMLClass) {

                    s += "var that = " + elem.ownedElements[i].target.name + "();\n";

                }

            }

        }

        return s;

    };

    MongooseCodeGenerator.prototype.setOperationVisibility = function (elem) {

        if (!elem || !elem.operations || !elem.operations.length) {

            return "";

        }

        var s = "";

        for (var i = 0; i < elem.operations.length; i++) {

            if (elem.operations[i].visibility === "public") {

                s += this.getTab() + "that." + elem.operations[i].name + " = " + elem.operations[i].name + ";\n";

            } else if (elem.operations[i].visibility === "protected") {

                s += this.getTab() + "proc." + elem.operations[i].name + " = " + elem.operations[i].name + ";\n";

            } else {

                //do nothing, they are already private.

            }

        }


        return s;

    };

    MongooseCodeGenerator.prototype.endClass = function (elem) {

        var s = "";

        s += "\n});\n";

        return s;
    }

    MongooseCodeGenerator.prototype.getExports = function (elem) {

        return "\nmodule.exports = mongoose.model('" + elem.name + "', " + elem.name + "Schema);\n";

    };

    /**
    * Get the name of the file to use to store the class
    * Sub classes can modify the case and dashing as needed.
    * @param elem the class to use
    */
    MongooseCodeGenerator.prototype.getFileName = function(fileName,withExtension){
       // first letter lower case
        var newFileName = fileName.substring(0,1).toLowerCase() + fileName.substring(1);
        if (withExtension) {
            newFileName += ".js";
        }
        return newFileName;
    };

    MongooseCodeGenerator.prototype.generate = function (elem) {

        var s = "";

        //file header
        s += this.getHeader(elem);

        //dependencies
        s += this.getDependancies(elem);

        //object definition, includes attributes
        s += this.getClassDefinition(elem);

        //functions
        s += this.getOperations(elem);

        //assign public and protected methods.
        s += this.setOperationVisibility(elem);

        s += this.endClass(elem);

        // exports at end of file.
        s += this.getExports(elem);


        return s;
    };

    exports.MongooseCodeGenerator = MongooseCodeGenerator;
});

