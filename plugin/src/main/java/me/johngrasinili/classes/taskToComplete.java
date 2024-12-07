package me.johngrasinili.classes;

import java.util.UUID;

public class taskToComplete {
    private UUID playerId;
    private String taskname;
    private String taskdescription;
    private String completionState = "active";

    public taskToComplete(UUID playerid, String taskname) {
        this.playerId = playerid;
        this.taskname = taskname;
    }

    public UUID getUUID() {
        return playerId;
    }

    public String getTaskName() {
        return taskname;
    }

    public String getTaskDescription() {
        return taskdescription;
    }

    public String getCompletionState() {
        return completionState;
    }

    public void setCompletionState(String state) {
        this.completionState = state;
    }
}
