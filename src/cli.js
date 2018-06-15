/*
Parses the Command Line Arguments passed to this process
 */
function parseCLIArgs(){
    //assign the args to a variable
    var args = process.argv;
    var parsedConfig = {
        script: args[1], //the name of the script that started this process
        args: {} //object to hold the parsed args
    };


    //loop through the arguments
    //we start at position 2, because the first item is "node"
    //and the second item is the script name
    for(var itemIdx=2;itemIdx<args.length;itemIdx++){

      var argItem = args[itemIdx];

      // split the current item on an equals sign,
      // this will result in an array with item 0 being the key
      // and item 1 being the key value
      var arg = argItem.split('=');

      parsedConfig.args[arg[0]] = arg[1];

    }

    return parsedConfig;
}

//create a parsed object
var parsedArgs = parseCLIArgs();


//return the parsed arguments
module.exports = parsedArgs;