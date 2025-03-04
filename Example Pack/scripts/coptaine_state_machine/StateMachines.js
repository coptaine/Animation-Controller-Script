import { world, system, Entity, DimensionTypes } from "@minecraft/server"

function generateUniqueKey() {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	let key = ""
	for (let i = 0; i < 10; i++) {
		key += characters[Math.floor(Math.random() * characters.length)]
	}
	return key + "_"
}

const UNIQUE_KEY = generateUniqueKey()

/**
 * @remarks A class for handling state machines.
 * @example
 * const DoubleJump = new StateMachines(actor => {
	const data = {
		name: "doubleJump",
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
	return data
})
*/
export class StateMachines {
	#isActive
	constructor(controller) {
		this.controller = controller
		this.#isActive = true
	}

	#run(actor, controller) {
		const controllerId = UNIQUE_KEY + controller.name
		if (!actor[controllerId]) {
			actor[controllerId] = {
				states: Object.keys(controller.states),
				currentState: controller.initialState ?? Object.keys(controller.states)[0],
				hasEntered: false
			}
		}

		const actorState = actor[controllerId]
		const currentState = controller.states[actorState.currentState]

		if (!actorState.hasEntered) {
			if (typeof currentState.onEntry == "function") currentState.onEntry()
			actorState.hasEntered = true
			return
		}

		if (!currentState.transitions || !currentState.transitions.length) return
		for (const transition of currentState.transitions) {
			if (Object.values(transition).includes(true)) {
				const nextState = Object.keys(transition)
				if (typeof currentState.onExit == "function") currentState.onExit()
				if (typeof controller.states[nextState].onEntry == "function") controller.states[nextState].onEntry()
				actorState.currentState = nextState
				actorState.hasEntered = true
				return
			}
		}
	}

	/**
	 * Activates the state machine which runs every tick.
	 * @param {string | Entity} actor The entity or identifier of the entity that will execute the state machine.
	 * @remarks
	 * - If an entity identifier (string) is provided, the state machine will be applied to all entities of that type.
	 * - If an `Entity` instance is provided, only that specific entity will be affected.
	 * @returns {void}
	 */
	activate(actor) {
		const newController = system.runInterval(() => {
			if (!this.#isActive) system.clearRun(newController)
			if (typeof actor != "string") return this.#run(actor, this.controller(actor))
			if (actor == "minecraft:player") {
				for (const player of world.getPlayers()) {
					this.#run(player, this.controller(player))
				}
				return
			}

			for (const dimension of DimensionTypes.getAll()) {
				for (const entity of world.getDimension(dimension.typeId).getEntities({ type: actor })) {
					this.#run(entity, this.controller(entity))
				}
			}
		}, 1)
	}

	/**
	 * Deactivates the state machine.
	 * @returns {void}
	 */
	deactivate() {
		this.#isActive = false
	}
}