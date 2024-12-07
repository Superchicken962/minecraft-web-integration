package me.johngrasinili.classes;

public class PlayerAction {
    private String type;
    private String itemcrafted;
    private int amountcrafted;

    public PlayerAction(String type, String itemcrafted, int amountcrafted) {
        this.type = type;
        this.itemcrafted = itemcrafted;
        this.amountcrafted = amountcrafted;
    }

    public String getType() {
        return type;
    }

    public String getItemCrafted() {
        return itemcrafted;
    }

    public int getAmountCrafted() {
        return amountcrafted;
    }
}