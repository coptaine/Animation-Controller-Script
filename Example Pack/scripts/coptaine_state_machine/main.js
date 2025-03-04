import { system, Entity } from "@minecraft/server"
import { StateMachines } from "./StateMachines"

const DoubleJump = new StateMachines(actor => {
     return {
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

DoubleJump.activate("minecraft:player")