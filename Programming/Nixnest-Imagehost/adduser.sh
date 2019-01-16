#!/usr/bin/env bash
data="$(cat users.json)"
users="$(echo "$data" | jq -r '.|keys|.[]')"
newKey="$(head -25 /dev/urandom | md5sum | awk '{print $1}')"

checkName() {

    shopt -s nocasematch
    echo "Checking for dupluicate names..."
    for user in $users
    do
        name=$(jq -r ".[\"$user\"].dir" <<< "$data")
        #echo also checking $name
        if [[ "$name" == "$1" ]]
        then
            #echo "Matches, fail"
            match="yes"
        else
            #echo "No match"
            match="no"
        fi
        if [ "$match" = "no" ]
        then
            :
        else
            return 1
        fi
    done
    return 0
}
while true
do
    read -r -p "Name: " newName
    checkName "$newName"
    case "$?" in
        0)
            break
            ;;
        1)
            echo -e "Name is already taken. Try again\n"
            ;;
    esac
done

echo "Name: $newName, Key : $newKey"
echo "$data" | jq ". + {\"$newKey\": {\"dir\": \"$newName\"}}" > users.json
echo "example: curl -X POST https://upload.nixne.st/image -H \"Upload-Key: $newKey\" -F \"uploadFile=@/path/to/file.png\""
