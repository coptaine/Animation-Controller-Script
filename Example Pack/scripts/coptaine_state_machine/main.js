import { system, Entity } from "@minecraft/server"
import { StateMachines } from "./StateMachines"

// Declaring the state machine
const DoubleJump = new StateMachines(actor => {
     return {
		name: "doubleJump", // any name, must be unique
          states: {
               "default": {
                    transitions: [
                         { "jump": !actor.isSneaking && actor.isJumping }
                    ]
               },
               "jump": {
                    transitions: [
                         { "default": actor.isOnGround },
                         { "doubleJumpInit": !actor.isJumping && !actor.isOnGround }
                    ]
               },
               "doubleJumpInit": {
                    transitions: [
                         { "default": actor.isOnGround },
                         { "doubleJump": actor.isJumping && !actor.isOnGround }
                    ],
                    onExit: () => actor.doubleJumpTick = system.currenTick
               },
               "doubleJump": {
                    onEntry: () => {
                         actor.applyKnockback(actor.location.x, actor.location.z, 0, 0.75)
                         actor.dimension.spawnParticle("minecraft:egg_destroy_emitter", actor.location)
                    },
                    transitions: [
                         { "default": actor.isOnGround }
                    ]
               }
          }
     }
})

// Activating the state machine
DoubleJump.activate("minecraft:player")

// Deactivating the state machine
system.afterEvents.scriptEventReceive.subscribe(e => {
     if (e.id == "coptaine:deactivate_double_jump") {
          DoubleJump.deactivate()
     }
})

