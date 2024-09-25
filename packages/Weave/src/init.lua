local RunService = game:GetService("RunService")

local Weave = {
	WeaveValue = require(script.WeaveValue),
	WeavePlayerValue = require(script.WeavePlayerValue),
	ZapPlayerValue = require(script.ZapPlayerValue),
	ProfileZapValue = require(script.ProfileZapValue),
	ProfileServiceValue = require(script.ProfileServiceValue),
	ProfileServerValue = require(script.ProfileServerValue),
	ProfileServiceObject = require(script.ProfileServiceObject),
}

local WeaveUtils = require(script.WeaveUtils)

--[=[
Remote Events and functions were inspired by the legend himself Sleitnick
https://github.com/Sleitnick/RbxUtil/tree/main/modules/net
]=]

--[=[
	Gets a RemoteEvent with the given name.

	On the server, if the RemoteEvent does not exist, then
	it will be created with the given name.

	On the client, if the RemoteEvent does not exist, then
	it will wait until it exists for at least 10 seconds.
	If the RemoteEvent does not exist after 10 seconds, an
	error will be thrown.

	```lua
	local remoteEvent = Weave:RemoteEvent("PointsChanged")
	```
]=]
function Weave:RemoteEvent(name: string)
	return WeaveUtils.RemoteEvent(name)
end

--[=[
	Gets an UnreliableRemoteEvent with the given name.

	On the server, if the UnreliableRemoteEvent does not
	exist, then it will be created with the given name.

	On the client, if the UnreliableRemoteEvent does not
	exist, then it will wait until it exists for at least
	10 seconds. If the UnreliableRemoteEvent does not exist
	after 10 seconds, an error will be thrown.

	```lua
	local unreliableRemoteEvent = Weave:UnreliableRemoteEvent("PositionChanged")
	```
]=]
function Weave:UnreliableRemoteEvent(name: string)
	local unreliableRemoteEvent
	name = `UnreliableRemoteEvents/{name}`
	if RunService:IsServer() then
		unreliableRemoteEvent = script:FindFirstChild(name)
		if unreliableRemoteEvent == nil then
			unreliableRemoteEvent = Instance.new("UnreliableRemoteEvent")
			unreliableRemoteEvent.Name = name
			unreliableRemoteEvent.Parent = script
		end
	else
		unreliableRemoteEvent = script:WaitForChild(name, 10)
		if unreliableRemoteEvent == nil then
			error(`Remote event not found {unreliableRemoteEvent}`)
		end
	end
	return unreliableRemoteEvent
end


--[=[
	Connects a handler function to the given RemoteEvent.

	```lua
	-- Client
	Weave:Connect("PointsChanged", function(points)
		print("Points", points)
	end)

	-- Server
	Weave:Connect("SomeEvent", function(player, ...) end)
	```
]=]
function Weave:Connect(name: string, handler: (...any) -> ()): RBXScriptConnection
	return WeaveUtils.Connect(name, handler)
end


--[=[
	Connects a handler function to the given UnreliableRemoteEvent.

	```lua
	-- Client
	Weave:ConnectUnreliable("PositionChanged", function(position)
		print("Position", position)
	end)

	-- Server
	Weave:ConnectUnreliable("SomeEvent", function(player, ...) end)
	```
]=]
function Weave:ConnectUnreliable(name: string, handler: (...any) -> ()): RBXScriptConnection
	if RunService:IsServer() then
		return self:UnreliableRemoteEvent(name).OnServerEvent:Connect(handler)
	else
		return self:UnreliableRemoteEvent(name).OnClientEvent:Connect(handler)
	end
end

--[=[
	Gets a RemoteFunction with the given name.

	On the server, if the RemoteFunction does not exist, then
	it will be created with the given name.

	On the client, if the RemoteFunction does not exist, then
	it will wait until it exists for at least 10 seconds.
	If the RemoteFunction does not exist after 10 seconds, an
	error will be thrown.

	```lua
	local remoteFunction = Weave:RemoteFunction("GetPoints")
	```
]=]
function Weave:RemoteFunction(name: string): RemoteFunction
	name = `RemoteFunctions/{name}`
	local remoteFunction
	if RunService:IsServer() then
		remoteFunction = script:FindFirstChild(name)
		if not remoteFunction then
			remoteFunction = Instance.new("RemoteFunction")
			remoteFunction.Name = name
			remoteFunction.Parent = script
		end
	else
		remoteFunction = script:WaitForChild(name, 10)
		if not remoteFunction then
			error("Failed to find RemoteFunction: " .. name, 2)
		end
	end
	return remoteFunction
end

--[=[
	@server
	Sets the invocation function for the given RemoteFunction.

	```lua
	Weave:Handle("GetPoints", function(player)
		return 10
	end)
	```
]=]
function Weave:Handle(name: string, handler: (player: Player, ...any) -> ...any)
	self:RemoteFunction(name).OnServerInvoke = handler
end

--[=[
	@client
	Invokes the RemoteFunction with the given arguments.

	```lua
	local points = Weave:Invoke("GetPoints")
	```
]=]
function Weave:Invoke(name: string, ...: any): ...any
	return self:RemoteFunction(name):InvokeServer(...)
end

--[=[
	@server
	Destroys all RemoteEvents and RemoteFunctions. This
	should really only be used in testing environments
	and not during runtime.
]=]
function Weave:Clean()
	script:ClearAllChildren()
end

return Weave
