class LinkedList {
    constructor(){
        this.length = 0;
        this.head = null;
    }
    // add node to the tail
    append(item){
        let node = new Node(item);
        
        // if first node
        if(!this.head){
            this.head = node;
        }else{
            // else find the tail
            let tail = this.head;
            while (tail.next !== null) {
                tail = tail.next;
            }
            tail.next = node;
        }
        this.length++;
    }

    get(item){

    }

}

class Node {
    constructor(item) {
        this.item = item;
        this.next = null;
    }
}

let ln = new LinkedList();
ln.append('1');
ln.append('2');
ln.append('3');
ln.append('4');
console.log(ln);
