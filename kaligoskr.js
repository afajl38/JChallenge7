// var rand = Math.floor(Math.random() * 100 +1);
// console.log(rand);

//
// function getRandomNumber(min,max){
//     let step1 = max-min +1;
//     let step2 = Math.random()*step1;
//     let result = Math.floor(step2) + min;
//     return result;
// }
//
// function  createArrayOfNumbers(start,end){
//     let myArray = [];
//     for(let i=start;i<= end;i++){
//
//         myArray.push();
//
//
//     }
//
//     return myArray;
// }
//
// let numbersArray = createArrayOfNumbers(1,10);
// function NonRepeat (){
//     if(numbersArray.length == 0){
//         output.innerText = "there re no RID remaining, plz contact the staff";
//         return;
//
//     }
//
//     let randomIndex = getRandomNumber(0,numbersArray.length-1);
//     let randomNumber = numbersArray[randomIndex];
//     numbersArray.splice(randomIndex,1);
//     output.innerText = randomNumber
//
//
//
// }

var myRnId = () => parseInt(Date.now() * Math.random());
console.log(myRnId());