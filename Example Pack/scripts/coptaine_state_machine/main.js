import { system, world } from "@minecraft/server"
import { StateMachine, savedStatesCleaner } from "./animation_controllers"

system.runInterval(() => {
  for (const player of world.getPlayers())
  StateMachine.run(player, "superJumpController")
}, 1)

savedStatesCleaner