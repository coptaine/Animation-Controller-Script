import { system, world } from "@minecraft/server"
import { StateMachine } from "./animation_controllers"

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    StateMachine.run(player, "doubleJumpController")
    StateMachine.run(player, "superJumpController")
    StateMachine.run(player, "elytraBoostController")
  }
}, 1)