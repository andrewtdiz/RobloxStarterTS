local WeaveUtils = {}
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

function WeaveUtils.GetWeaveFolder()
	local weaveFolder
	if RunService:IsClient() then
		weaveFolder = game.Workspace:WaitForChild("WeaveFolder", 5)
		if weaveFolder == nil then
			error("Weave Folder not found on client")
		end
	else
		weaveFolder = game.Workspace:FindFirstChild("WeaveFolder")
		if weaveFolder == nil then
			weaveFolder = Instance.new("Folder")
			weaveFolder.Name = "WeaveFolder"
			weaveFolder.Parent = game.Workspace
		end
	end
	return weaveFolder
end

function WeaveUtils.TableType(someObject)
	if typeof(someObject) ~= "table" then
		return "NotTable"
	end
	local isList = true

	local index = 0
	for key, _ in pairs(someObject) do
		index = index + 1
		if key ~= index then
			isList = false
			break
		end
	end
	if isList then
		return "List"
	else
		return "Object"
	end
end

function WeaveUtils.MethodExists(obj, methodName)
	return type(obj[methodName]) == "function"
end

function WeaveUtils.IsCorrectInstanceType(initialValue: any, instance: Instance)
	local valueType = typeof(initialValue)
	if valueType == "table" and instance.ClassName == "Folder" then
		return WeaveUtils.TableType(initialValue) == instance:GetAttribute("Type")
	end
	if valueType == "number" and instance.ClassName == "NumberValue" then
		return true
	end
	if valueType == "string" and instance.ClassName == "StringValue" then
		return true
	end
	if valueType == "boolean" and instance.ClassName == "BoolValue" then
		return true
	end
	return false
end

function WeaveUtils.IsAPlayer(value: any)
	return typeof(value) == "Instance" and value:IsA("Player")
end

function WeaveUtils.GetNewInstance(key: any, initialValue: any)
	local newInstance
	local valueType = typeof(initialValue)
	if valueType == "table" then
		newInstance = Instance.new("Folder")
		if WeaveUtils.IsAPlayer(key) then
			newInstance:SetAttribute("isPlayerKey", true)
			newInstance.Name = `{key.UserId}`
		else
			newInstance.Name = key
		end
		newInstance.Parent = WeaveUtils.GetWeaveFolder()
		newInstance:SetAttribute("Type", WeaveUtils.TableType(initialValue))
		for newValueKey, newValue in pairs(initialValue) do
			local newValueInstance = WeaveUtils.GetNewInstance(newValueKey, newValue)
			newValueInstance.Parent = newInstance
		end
		return newInstance
	elseif valueType == "string" then
		newInstance = Instance.new("StringValue")
	elseif valueType == "boolean" then
		newInstance = Instance.new("BoolValue")
	elseif valueType == "number" then
		newInstance = Instance.new("NumberValue")
	end
	if WeaveUtils.IsAPlayer(key) then
		newInstance:SetAttribute("isPlayerKey", true)
		newInstance.Name = `{key.UserId}`
	else
		newInstance.Name = key
	end
	newInstance.Parent = WeaveUtils.GetWeaveFolder()
	newInstance.Value = initialValue
	return newInstance
end

function WeaveUtils.GetValueFromInstance(instance: Instance)

	if instance:IsA("StringValue") or instance:IsA("BoolValue") or instance:IsA("NumberValue") then
		return instance.Value
	end

	if instance:IsA("Folder") then
		local tableType = instance:GetAttribute("Type")
		local outTable
		if tableType == "List" then
			outTable = {}
			for _, __ in ipairs(instance:GetChildren()) do
				table.insert(outTable, {})
			end
			for _, child in ipairs(instance:GetChildren()) do
				local keyName = tonumber(child.Name)
				outTable[keyName] = WeaveUtils.GetValueFromInstance(child)
			end
		elseif tableType == "Object" then
			outTable = {}
			for _, child in ipairs(instance:GetChildren()) do
				local newKey = WeaveUtils.GetKeyNameFromInstance(child)
				outTable[newKey] = WeaveUtils.GetValueFromInstance(child)
			end
		else
			error(`Table Type {tableType} is not supported for folder {instance}`)
		end
		return outTable
	end
	return nil
end

function WeaveUtils.GetKeyNameFromInstance(instance: Instance)
	if instance:GetAttribute("isPlayerKey") then
		local userId = tonumber(instance.Name)
		local player = Players:GetPlayerByUserId(userId)
		return player
	end
	return instance.Name
end

function WeaveUtils.RemoteEvent(name: string)
	local remoteEvent
	name = `RemoteEvents/{name}`
	if RunService:IsServer() then
		remoteEvent = script:FindFirstChild(name)
		if remoteEvent == nil then
			remoteEvent = Instance.new("RemoteEvent")
			remoteEvent.Name = name
			remoteEvent.Parent = script
		end
	else
		remoteEvent = script:WaitForChild(name, 10)
		if remoteEvent == nil then
			error(`Remote event not found {remoteEvent}`)
		end
	end
	return remoteEvent
end

function WeaveUtils.Connect(name: string, handler: (...any) -> ()): RBXScriptConnection
	if RunService:IsServer() then
		return WeaveUtils.RemoteEvent(name).OnServerEvent:Connect(handler)
	else
		return WeaveUtils.RemoteEvent(name).OnClientEvent:Connect(handler)
	end
end

return WeaveUtils
